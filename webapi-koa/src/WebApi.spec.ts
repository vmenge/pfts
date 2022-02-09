import Koa from "koa";
import supertest from "supertest";

import { WebApi } from "./WebApi";
import { useTestWebApi } from "./WebApiFactory";

describe("Captures path params", () => {
  const app = new Koa();
  const webApi = WebApi.new(app).route(router =>
    router
      .get("/:id", async ({ req }) => ({ status: 200, body: req.params }))
      .get("/hello", async () => "hello")
      .get("/hello/:name", async ({ req }) => ({ status: 200, body: req.params }))
  );

  const testServer = useTestWebApi({ builder: webApi, dependencies: {} });
  const getTestApp = () => {
    const [app, _] = testServer();
    return supertest(app);
  };

  it("Still resolves the /hello route", async () => {
    const testApp = getTestApp();
    const res = await testApp.get("/hello");

    expect(res.status).toEqual(200);
    expect(res.text).toEqual("hello");
  });

  it("Resolves the :id path param endpoint", async () => {
    const testApp = getTestApp();
    const res = await testApp.get("/bananas");

    expect(res.status).toEqual(200);
    expect(res.body.id).toEqual("bananas");
  });

  it("Resolves the /hello/:name path param endpoint", async () => {
    const testApp = getTestApp();
    const res = await testApp.get("/hello/bleble");

    expect(res.status).toEqual(200);
    expect(res.body.name).toEqual("bleble");
  });
});
