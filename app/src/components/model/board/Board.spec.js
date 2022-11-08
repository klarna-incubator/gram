import { render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { createMockStore } from "redux-test-utils";
import Board from "./Board";

const renderComponent = (props, store) =>
  render(
    <Provider store={store}>
      <Router>
        <Board {...props} />
      </Router>
    </Provider>
  );

describe("Board", () => {
  const store = createMockStore({
    webSocket: {
      activeUsers: [
        {
          sub: "joakim-user@example.com",
          name: "Joakim",
          picture:
            "https://lh3.googleusercontent.com/a-/AOh14GgdymGKjsQ_o2qinWiQHaCV_iUcAkvv29JVOAcy=s96-c",
          color: "#00AA55",
        },
      ],
    },
    model: {
      pending: false,
      error: null,
      components: [
        {
          x: 795.9425250356825,
          y: 155.0038138469846,
          id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
          name: "test",
          type: "proc",
          classes: [
            {
              id: "7780205a-763f-4691-9042-2108a2e39430",
              icon: "/assets/svgporn/k-larna.png",
              name: "K-larna",
              componentType: "any",
            },
          ],
        },
        {
          x: 723.7372388860397,
          y: 492.67597578698394,
          id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
          name: "Hmmm",
          type: "ee",
          classes: [
            {
              id: "8ca7c157-05ac-46cc-9a3a-d2799016ded1",
              icon: "/assets/aws/Arch_Analytics/Arch_16/Arch_AWS-Glue_16.svg",
              name: "AWS Glue",
              componentType: "any",
            },
          ],
        },
        {
          x: 65.93236816863714,
          y: 447.8506123152255,
          id: "06f63f68-c74e-4afe-a9de-4c7efc5dbdf4",
          name: "hej",
          type: "ee",
        },
        {
          x: 1088.0731769201598,
          y: 357.54553794773915,
          id: "4e6f582d-8da9-4e9d-a981-fc019d7fac2c",
          name: "Internet",
          type: "ee",
          classes: [
            {
              id: "29f827b0-9a0f-4e2a-963c-85a4354cc0ed",
              icon: "/assets/aws/Arch_Analytics/Arch_16/Arch_AWS-Data-Pipeline_16.svg",
              name: "AWS Data Pipeline",
              componentType: "any",
            },
          ],
        },
        {
          x: 256.87416015132317,
          y: 151.26467733075327,
          id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
          name: "hm",
          type: "ds",
        },
        {
          x: 265.03296564113924,
          y: -72.20822451589031,
          id: "0285cd9f-b9d8-4cb3-bf1d-acd4add1f14a",
          name: "test",
          type: "proc",
        },
      ],
      dataFlows: [
        {
          id: "a342eeae-ef4f-4d33-9b30-7884ed2cdc09",
          points: [
            265.93236816863714, 497.8506123152255, 356.87416015132317,
            251.26467733075327,
          ],
          endComponent: {
            id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
          },
          startComponent: {
            id: "06f63f68-c74e-4afe-a9de-4c7efc5dbdf4",
          },
        },
        {
          id: "ad628c45-124b-44a6-a7d2-15736de983e9",
          points: [
            356.87416015132317, 151.26467733075327, 365.03296564113924,
            27.791775484109692,
          ],
          endComponent: {
            id: "0285cd9f-b9d8-4cb3-bf1d-acd4add1f14a",
          },
          startComponent: {
            id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
          },
        },
        {
          id: "337c06cb-3c28-4526-8b60-1ff688a26a9a",
          points: [
            723.7372388860397, 542.6759757869839, 456.87416015132317,
            201.26467733075327,
          ],
          endComponent: {
            id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
          },
          startComponent: {
            id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
          },
        },
        {
          id: "38a93572-3eee-4231-8760-b188af655b48",
          points: [
            795.9425250356825, 205.0038138469846, 456.87416015132317,
            201.26467733075327,
          ],
          endComponent: {
            id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
          },
          startComponent: {
            id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
          },
        },
        {
          id: "0e4647df-23c8-4d6b-be0a-d1c2d1512f16",
          points: [
            895.9425250356825, 255.0038138469846, 823.7372388860397,
            492.67597578698394,
          ],
          endComponent: {
            id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
          },
          startComponent: {
            id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
          },
        },
        {
          id: "110609f6-9e72-447d-a156-31504b8b9caa",
          points: [
            1088.0731769201598, 407.54553794773915, 995.9425250356825,
            205.0038138469846,
          ],
          endComponent: {
            id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
          },
          startComponent: {
            id: "4e6f582d-8da9-4e9d-a981-fc019d7fac2c",
          },
        },
        {
          id: "8a6e0590-f525-4510-9f02-9c2fb38dab11",
          points: [
            1088.0731769201598, 407.54553794773915, 923.7372388860397,
            542.6759757869839,
          ],
          endComponent: {
            id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
          },
          startComponent: {
            id: "4e6f582d-8da9-4e9d-a981-fc019d7fac2c",
          },
        },
      ],
      selected: {},
      deleted: false,
      componentForm: {
        show: false,
        id: null,
        value: "",
        x: null,
        y: null,
      },
      permissions: {
        pending: false,
        permissions: ["read", "write", "delete", "review"],
      },
      review: {
        pending: true,
        review: null,
      },
      id: "bc5a8039-60ef-4eca-904e-21bd0e782d2d",
      systemId: "00000000-0000-0000-0000-000000000000",
      version: "2021-09-23",
      data: {
        dataFlows: [
          {
            id: "a342eeae-ef4f-4d33-9b30-7884ed2cdc09",
            points: [
              265.93236816863714, 497.8506123152255, 356.87416015132317,
              251.26467733075327,
            ],
            endComponent: {
              id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
            },
            startComponent: {
              id: "06f63f68-c74e-4afe-a9de-4c7efc5dbdf4",
            },
          },
          {
            id: "ad628c45-124b-44a6-a7d2-15736de983e9",
            points: [
              356.87416015132317, 151.26467733075327, 365.03296564113924,
              27.791775484109692,
            ],
            endComponent: {
              id: "0285cd9f-b9d8-4cb3-bf1d-acd4add1f14a",
            },
            startComponent: {
              id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
            },
          },
          {
            id: "337c06cb-3c28-4526-8b60-1ff688a26a9a",
            points: [
              723.7372388860397, 542.6759757869839, 456.87416015132317,
              201.26467733075327,
            ],
            endComponent: {
              id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
            },
            startComponent: {
              id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
            },
          },
          {
            id: "38a93572-3eee-4231-8760-b188af655b48",
            points: [
              795.9425250356825, 205.0038138469846, 456.87416015132317,
              201.26467733075327,
            ],
            endComponent: {
              id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
            },
            startComponent: {
              id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
            },
          },
          {
            id: "0e4647df-23c8-4d6b-be0a-d1c2d1512f16",
            points: [
              895.9425250356825, 255.0038138469846, 823.7372388860397,
              492.67597578698394,
            ],
            endComponent: {
              id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
            },
            startComponent: {
              id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
            },
          },
          {
            id: "110609f6-9e72-447d-a156-31504b8b9caa",
            points: [
              1088.0731769201598, 407.54553794773915, 995.9425250356825,
              205.0038138469846,
            ],
            endComponent: {
              id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
            },
            startComponent: {
              id: "4e6f582d-8da9-4e9d-a981-fc019d7fac2c",
            },
          },
          {
            id: "8a6e0590-f525-4510-9f02-9c2fb38dab11",
            points: [
              1088.0731769201598, 407.54553794773915, 923.7372388860397,
              542.6759757869839,
            ],
            endComponent: {
              id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
            },
            startComponent: {
              id: "4e6f582d-8da9-4e9d-a981-fc019d7fac2c",
            },
          },
        ],
        components: [
          {
            x: 795.9425250356825,
            y: 155.0038138469846,
            id: "949b3308-7d7e-4bdd-84d3-ed147edec355",
            name: "test",
            type: "proc",
            classes: [
              {
                id: "7780205a-763f-4691-9042-2108a2e39430",
                icon: "/assets/svgporn/k-larna.png",
                name: "K-larna",
                componentType: "any",
              },
            ],
          },
          {
            x: 723.7372388860397,
            y: 492.67597578698394,
            id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d",
            name: "Hmmm",
            type: "ee",
            classes: [
              {
                id: "8ca7c157-05ac-46cc-9a3a-d2799016ded1",
                icon: "/assets/aws/Arch_Analytics/Arch_16/Arch_AWS-Glue_16.svg",
                name: "AWS Glue",
                componentType: "any",
              },
            ],
          },
          {
            x: 65.93236816863714,
            y: 447.8506123152255,
            id: "06f63f68-c74e-4afe-a9de-4c7efc5dbdf4",
            name: "hej",
            type: "ee",
          },
          {
            x: 1088.0731769201598,
            y: 357.54553794773915,
            id: "4e6f582d-8da9-4e9d-a981-fc019d7fac2c",
            name: "Internet",
            type: "ee",
            classes: [
              {
                id: "29f827b0-9a0f-4e2a-963c-85a4354cc0ed",
                icon: "/assets/aws/Arch_Analytics/Arch_16/Arch_AWS-Data-Pipeline_16.svg",
                name: "AWS Data Pipeline",
                componentType: "any",
              },
            ],
          },
          {
            x: 256.87416015132317,
            y: 151.26467733075327,
            id: "9987991f-daa9-4b08-a04d-d5e026d2a47e",
            name: "hm",
            type: "ds",
          },
          {
            x: 265.03296564113924,
            y: -72.20822451589031,
            id: "0285cd9f-b9d8-4cb3-bf1d-acd4add1f14a",
            name: "test",
            type: "proc",
          },
        ],
      },
      createdBy: "erik-user@example.com",
      createdAt: 1632391131301.814,
      updatedAt: 1632391131301.814,
      context: {
        items: [],
      },
    },
    threats: {
      error: null,
      pending: false,
      threats: {},
    },
    controls: {
      error: null,
      pending: false,
      controls: {},
    },
    mitigations: {
      error: null,
      pending: false,
      mitigations: {},
    },
  });

  it("renders Board", () => {
    const props = {};
    expect(renderComponent(props, store)).toMatchSnapshot();
  });
});
