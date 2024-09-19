package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"syscall"
	"time"

	"golang.org/x/term"
)

type Auth struct {
	Username string
	Password string
}

type StartBastionResponse struct {
	RequestID string `json:"request_id"`
}

type InstanceData struct {
	InstanceDNSName string `json:"dns_name"`
	InstanceIP      string `json:"ip_address"`
}

type BastionStatusResponse struct {
	InstanceStatus string       `json:"instance_status"`
	InstanceData   InstanceData `json:"instance_data"`
	ExpiryTime     string       `json:"expiry_time"`
}

const bastionRequestBody = `
{
  "systemid": "gram",
  "justification": "Access to RDS",
  "duration": 3600,
  "subnets": ["10.0.0.0/8"],
  "allow_tunneling": true,
  "ports": ["5432"]
}
`

func startBastion(auth Auth) (StartBastionResponse, error) {
	url := "https://bastion.klarna.net/api/v1/request"
	client := &http.Client{}
	req, err := http.NewRequest("POST", url, strings.NewReader(bastionRequestBody))
	if err != nil {
		return StartBastionResponse{}, err
	}
	req.SetBasicAuth(auth.Username, auth.Password)
	resp, err := client.Do(req)
	if err != nil {
		return StartBastionResponse{}, err
	}
	defer resp.Body.Close()

	fmt.Println(resp.Status)

	if resp.StatusCode != 202 {
		b, err := io.ReadAll(resp.Body)
		if err != nil {
			return StartBastionResponse{}, err
		}
		fmt.Println(string(b))

		if resp.StatusCode == 403 {
			fmt.Println("# Hint: Double-check that typed your password correctly and the LDAP user is correct:", auth.Username)
		}

		return StartBastionResponse{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var result StartBastionResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return StartBastionResponse{}, err
	}
	return result, nil
}

func bastionStatus(auth Auth, requestID string) (BastionStatusResponse, error) {
	url := fmt.Sprintf("https://bastion.klarna.net/api/v1/request/%s", requestID)
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return BastionStatusResponse{}, err
	}
	req.SetBasicAuth(auth.Username, auth.Password)

	resp, err := client.Do(req)
	if err != nil {
		return BastionStatusResponse{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return BastionStatusResponse{InstanceStatus: "NOT_FOUND"}, nil
	}

	if resp.StatusCode != 202 && resp.StatusCode != 200 {
		fmt.Println(resp.StatusCode)
		b, err := io.ReadAll(resp.Body)
		if err != nil {
			return BastionStatusResponse{}, err
		}
		fmt.Println(string(b))

		if resp.StatusCode == 403 {
			fmt.Println("# Hint: Double-check that typed your password correctly and the LDAP user is correct:", auth.Username)
		}

		return BastionStatusResponse{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var result BastionStatusResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		return BastionStatusResponse{}, err
	}
	return result, nil
}

func StartSSHTunnel(ready chan bool, done chan error, proxyTarget string, proxyUser string, proxyHost string) {
	c := fmt.Sprintf("-t -A -L 5433:%s:5432 %s@%s", proxyTarget, proxyUser, proxyHost)
	// Might need to unset TMOUT (this didnt work, but might be useful for future lookup) -o RemoteCommand='export TMOUT=; printenv; bash -l'
	args := strings.Split(c, " ")
	fmt.Println("ssh", c)
	cmd := exec.Command("/usr/bin/ssh", args...)

	out, err := cmd.StdoutPipe()
	if err != nil {
		panic(err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		panic(err)
	}
	outscan := bufio.NewScanner(out)
	errscan := bufio.NewScanner(stderr)

	cmd.Start()

	successLooksLike := "NOTE: This SSH session will be recorded,"

	go func() {
		readySent := false
		allOutput := ""
		for outscan.Scan() {
			txt := outscan.Text()
			allOutput += txt
			fmt.Print(txt)

			if !readySent && strings.Contains(allOutput, successLooksLike) {
				ready <- true
				readySent = true
			}
		}
	}()

	go func() {
		for errscan.Scan() {
			fmt.Println(errscan.Text())
		}
	}()

	done <- cmd.Wait()
}

func saveRequestID(requestID string) {
	f, err := os.Create(".bastion-request-id")
	if err != nil {
		log.Fatalf("Error saving request ID: %v", err)
	}
	defer f.Close()
	_, err = f.WriteString(requestID)
	if err != nil {
		log.Fatalf("Error saving request ID: %v", err)
	}
}

func loadRequestID() string {
	f, err := os.Open(".bastion-request-id")
	if err != nil {
		return ""
	}
	defer f.Close()
	r := bufio.NewReader(f)
	line, _, err := r.ReadLine()
	if err != nil {
		return ""
	}
	return string(line)
}

func main() {
	environments := map[string]string{
		"prod":    "gram-production-database-cluster.cluster-cludl8iseytr.eu-west-1.rds.amazonaws.com",
		"staging": "gram-staging-database-cluster.cluster-ctfvbr0ed3wr.eu-west-1.rds.amazonaws.com",
	}

	envPtr := flag.String("env", "", "Environment to connect to. Options: prod, staging")
	flag.Parse()

	env, ok := environments[*envPtr]
	if !ok {
		fmt.Println("Invalid environment")
		fmt.Println("Usage: bastion -env <prod|staging>")
		os.Exit(1)
	}

	fmt.Println("# Setting up your tunnel to", env)

	fmt.Println("# To interact with the Bastion API, we need your LDAP credentials")
	username := getUsername()
	if username == "" {
		fmt.Println("environment variable AD_USERNAME or USER is not set")
		os.Exit(1)
	}

	password := os.Getenv("AD_PASSWORD")
	if password == "" {
		fmt.Print("> Enter your LDAP password: ")
		bytepw, err := term.ReadPassword(syscall.Stdin)
		if err != nil {
			os.Exit(1)
		}
		password = string(bytepw)
	}
	auth := Auth{Username: username, Password: password}
	fmt.Println()

	// Check if there is a request ID saved
	var requestID string
	prevRequestID := loadRequestID()
	if prevRequestID != "" {
		status, err := bastionStatus(auth, prevRequestID)
		if err != nil {
			log.Fatalf("Error checking bastion status: %v", err)
		}
		if status.InstanceStatus != "NOT_FOUND" {
			j, _ := json.MarshalIndent(status, "", "  ")

			expireTime := parseExpireTime(status.ExpiryTime)

			if expireTime.After(time.Now()) {
				fmt.Println("# Found a previous bastion requestID:", prevRequestID)
				fmt.Println(string(j))
				fmt.Println("# Bastion will expire in:", time.Until(expireTime))
				if err != nil {
					log.Fatalf("Error checking bastion status: %v", err)
				}
				fmt.Println(status)

				fmt.Print("> Do you want to reuse it? (y/n): ")
				var reuse string
				fmt.Scanln(&reuse)
				if reuse == "y" {
					fmt.Println("# Reusing request ID:", prevRequestID)
					requestID = prevRequestID
					fmt.Println()
				}
			}
		}
	}

	if requestID == "" {
		fmt.Println("# Requesting bastion instance...")

		result, err := startBastion(auth)
		if err != nil {
			log.Fatalf("Error starting bastion: %v", err)
		}
		requestID = result.RequestID
		saveRequestID(requestID)
	}

	fmt.Println("# Bastion request ID:", requestID)

	fmt.Println("# This may take a few minutes")
	var status BastionStatusResponse
	for {
		fmt.Print("# Checking bastion status...")
		tmpStatus, err := bastionStatus(auth, requestID)
		if err != nil {
			log.Fatalf("Error checking bastion status: %v", err)
		}
		fmt.Println(tmpStatus.InstanceStatus)
		if tmpStatus.InstanceStatus == "READY" {
			status = tmpStatus
			break
		}
		time.Sleep(30 * time.Second)
	}

	fmt.Println("# Bastion instance is ready")
	j, _ := json.MarshalIndent(status, "", "  ")
	fmt.Println(string(j))
	fmt.Println()
	fmt.Println("# Setting up the SSH tunnel now...")

	done := make(chan error)
	ready := make(chan bool)
	go StartSSHTunnel(ready, done, env, username, status.InstanceData.InstanceDNSName)

	isDone := false
	for !isDone {
		select {
		case <-ready:
			fmt.Println()
			fmt.Println()
			fmt.Printf("# Looks like your SSH tunnel is ready. The tunnel is open for another %s\n", time.Until(parseExpireTime(status.ExpiryTime)))
			fmt.Println("# You can connect to the RDS instance using the following command:")
			fmt.Printf("./%s-psql.sh\n", *envPtr)
			fmt.Println()
			fmt.Println("# Press Ctrl+C to exit and close the tunnel")
			fmt.Println("# Press Ctrl+Z; then run `bg` to put this tunnel in the background")
		case err := <-done:
			if err != nil {
				fmt.Println("SSH tunnel error:", err)
			}
			fmt.Println("Bye :)")
			isDone = true
		}
	}

	for {
		time.Sleep(1 * time.Hour)
	}
}

func parseExpireTime(expireTime string) time.Time {
	// Format looks like: "20240918163436076110"
	// So... YYYYMMDDHHMMSS, ignore the rest
	if len(expireTime) < 14 {
		log.Fatalf("Invalid expire time: %s", expireTime)
	}
	t, err := time.Parse("20060102150405", expireTime[:14])
	if err != nil {
		log.Fatal(err)
	}
	return t
}

func getUsername() string {
	username := os.Getenv("AD_USERNAME")
	if username == "" {
		username = os.Getenv("USER")
	}
	return username
}
