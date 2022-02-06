import Koa from "koa";
import { pathToRegexp, match, Key } from "path-to-regexp";

export type HttpRequest = {
  url: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string[] | string | undefined>;
  method: string;
  headers: Record<string, string[] | string>;
  body?: any;
  ip: string;
};

export const HttpRequest = {
  ofKoaRequest(req: Koa.Request, params: Record<string, string>): HttpRequest {
    const headers = Object.entries(req.headers).reduce(
      (obj, [key, val]) => ({ ...obj, [key]: val }),
      {}
    );

    return {
      url: req.URL.toString(),
      path: req.path,
      params: params,
      query: req.query,
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

const pathSpecificity = (path: string): number => {
  const keys: Key[] = [];
  const _ = pathToRegexp(path, keys);
  const parts = path.split("/").length;

  return parts - keys.length;
};

type Middleware = {
  path: string;
  specificity: number;
  middleware: Koa.Middleware;
};

const createReqHandler = <T>(
  method: HttpMethod,
  path: string,
  handler: HttpHandler<T>,
  deps: T
): Middleware => {
  const specificity = pathSpecificity(path);

  const middleware = async (ctx: Koa.Context, next: Koa.Next) => {
    if (ctx.request.method !== method) return next();

    const matcher = match(path, { decode: decodeURIComponent });
    const matches = matcher(ctx.request.path);
    if (!matches) return next();

    const httpRes = await handler({
      ...deps,
      req: HttpRequest.ofKoaRequest(ctx.request, matches.params as any),
      ctx,
    });

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

  return { path, specificity, middleware };
};

export class WebApiRouter<T = {}> {
  private constructor(private readonly middlewares: ((t: T) => Middleware)[]) {}

  static new = <T>(): WebApiRouter<T> => new WebApiRouter([]);

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

  build(t: T): Middleware[] {
    return this.middlewares.map(fn => fn(t));
  }
}

export class WebApi<T = {}> {
  private constructor(
    private readonly app: Koa,
    private readonly middlewares: Koa.Middleware[],
    private readonly routers: WebApiRouter<T>[]
  ) {}

  static new = (app: Koa): WebApi<{}> => new WebApi(app, [], []);

  use(middleware: Koa.Middleware): WebApi<T> {
    return new WebApi(this.app, [...this.middlewares, middleware], this.routers);
  }

  route<K>(
    cfgRoutes: (router: WebApiRouter) => WebApiRouter<K>
  ): WebApi<{ [k in keyof (T & K)]: (T & K)[k] }> {
    return new WebApi(this.app, this.middlewares, [
      ...this.routers,
      cfgRoutes(WebApiRouter.new()),
    ] as any);
  }

  build(t: T): Koa {
    const routes = [...this.routers]
      .flatMap(r => r.build(t))
      .sort((a, b) => b.specificity - a.specificity)
      .map(x => x.middleware);

    for (const middleware of [...this.middlewares, ...routes]) {
      this.app.use(middleware);
    }

    return this.app;
  }
}
