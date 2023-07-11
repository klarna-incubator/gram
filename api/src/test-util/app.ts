import createApp from "../app";
import { createPostgresPool } from "@gram/core/dist/data/postgres";
import {
  Plugin,
  PluginCompiler,
  PluginRegistrator,
} from "@gram/core/dist/plugin";
import {
  SampleEmailMeetingRequested,
  SampleEmailReviewApproved,
  SampleEmailRequested,
} from "./sampleNotifications";
import { testUserProvider } from "./sampleUser";
import { testSystemProvider } from "./system";
import classes from "./classes.json";
import { ComponentClass } from "@gram/core/dist/data/component-classes";
import { testReviewerProvider } from "./sampleReviewer";

const toComponentClass = (o: any): ComponentClass => {
  return {
    id: o.id,
    name: o.name,
    icon: o.icon,
    componentType: o.componentType,
  };
};

class TestPack implements Plugin {
  async bootstrap(reg: PluginRegistrator): Promise<void> {
    reg.setSystemProvider(testSystemProvider);
    reg.registerNotificationTemplates([
      SampleEmailReviewApproved,
      SampleEmailMeetingRequested,
      SampleEmailRequested,
    ]);
    reg.setUserProvider(testUserProvider);
    reg.setReviewerProvider(testReviewerProvider);
    reg.registerComponentClasses(classes.map((logo) => toComponentClass(logo)));
  }
}

export async function createTestApp() {
  const pool = await createPostgresPool();
  const { app, dal } = await createApp(pool);

  const compiler = new PluginCompiler(dal, app);
  const pack = new TestPack();
  await pack.bootstrap(compiler);

  return { pool, app, dal };
}
