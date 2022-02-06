import Koa from "koa";

export type HttpRequest = {
  url: string;
  path: string;
  method: string;
  headers: Record<string, string[] | string>;
  body?: any;
  ip: string;
};

export const HttpRequest = {
  ofKoaRequest(req: Koa.Request): HttpRequest {
    const headers = Object.entries(req.headers).reduce(
      (obj, [key, val]) => ({ ...obj, [key]: val }),
      {}
    );

    return {
      url: req.URL.toString(),
      path: req.path,
      method: req.method,
      headers,
      body: (req as any).body,
      ip: req.ip,
    };
  },
};

export type HttpResponse = {
  status: number;
  headers?: Record<string, string | string[]>;
  body?: any;
};

export type HandlerContext<T> = T & { req: HttpRequest; ctx: Koa.Context };

export type HttpHandler<Dependencies = {}> = (
  ctx: HandlerContext<Dependencies>
) => Promise<HttpResponse | number | string>;

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "CONNECT"
  | "TRACE";

const createReqHandler =
  <T>(method: HttpMethod, path: string, handler: HttpHandler<T>, deps: T) =>
  async (ctx: Koa.Context, next: Koa.Next) => {
    if (ctx.request.method !== method || ctx.request.path !== path) {
      return next();
    }

    const httpRes = await handler({ ...deps, req: HttpRequest.ofKoaRequest(ctx.request), ctx });

    if (typeof httpRes === "number") {
      ctx.status = httpRes;
      return;
    }

    if (typeof httpRes === "string") {
      ctx.body = httpRes;
      return;
    }

    if (httpRes.headers) {
      for (const [key, val] of Object.entries(httpRes.headers)) {
        ctx.set(key, val);
      }
    }

    if (httpRes.body) {
      ctx.body = httpRes.body;
    }

    ctx.status = httpRes.status;
  };

export class WebApiRouter<T = {}> {
  private constructor(private readonly middlewares: ((t: T) => Koa.Middleware)[]) {}

  static new = <T>(): WebApiRouter<T> => new WebApiRouter([]);

  use(middleware: Koa.Middleware): WebApiRouter<T> {
    return new WebApiRouter([...this.middlewares, () => middleware]);
  }

  get<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("GET", path, handler, k),
    ] as any);
  }

  post<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("POST", path, handler, k),
    ] as any);
  }

  patch<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("PATCH", path, handler, k),
    ] as any);
  }

  put<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("PUT", path, handler, k),
    ] as any);
  }

  head<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("HEAD", path, handler, k),
    ] as any);
  }

  options<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("OPTIONS", path, handler, k),
    ] as any);
  }

  connect<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("CONNECT", path, handler, k),
    ] as any);
  }

  trace<K>(
    path: string,
    handler: HttpHandler<K>
  ): WebApiRouter<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApiRouter([
      ...this.middlewares,
      (k: K) => createReqHandler("TRACE", path, handler, k),
    ] as any);
  }

  build(t: T): Koa.Middleware[] {
    return this.middlewares.map(fn => fn(t));
  }
}

export class WebApi<T = {}> {
  private constructor(private readonly app: Koa, private readonly routers: WebApiRouter<T>[]) {}

  static new = (app: Koa): WebApi<{}> => new WebApi(app, []);

  use(middleware: Koa.Middleware): WebApi<T> {
    return new WebApi(this.app, [...this.routers, WebApiRouter.new().use(middleware)]);
  }

  route<K>(
    cfgRoutes: (router: WebApiRouter) => WebApiRouter<K>
  ): WebApi<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApi(this.app, [...this.routers, cfgRoutes(WebApiRouter.new())] as any);
  }

  build(t: T): Koa {
    const middlewares = this.routers.flatMap(r => r.build(t));
    for (const middleware of middlewares) {
      this.app.use(middleware);
    }

    return this.app;
  }
}
