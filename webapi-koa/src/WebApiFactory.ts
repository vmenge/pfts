import { Server } from "http";
import { WebApi } from "./WebApi";

type TestAppState<T> = {
  busy?: boolean;
  server?: Server;
  deps?: T;
};

export type TestWebApiSettings<T> = {
  builder: WebApi<T>;
  dependencies: T | (() => Promise<T>);
  onClose?: (dependencies: T) => Promise<void>;
};

export const useTestWebApi = <T>({
  builder,
  dependencies,
  onClose,
}: TestWebApiSettings<T>): (() => [Server, T]) => {
  const state: TestAppState<T> = {
    busy: undefined,
    server: undefined,
    deps: undefined,
  };

  beforeAll(done => {
    if (state.busy) {
      done();
      return;
    }

    state.busy = true;

    if (typeof dependencies === "function") {
      (dependencies as () => Promise<T>)().then(deps => {
        state.deps = deps;
        state.server = builder.build(deps).listen();
        done();
      });
    } else {
      state.deps = dependencies as T;
      state.server = builder.build(state.deps).listen();
      done();
    }
  });

  afterAll(done => {
    state.server?.close(err => {
      if (err) {
        console.error(`Something went wrong when closing the test server: ${err}`);
      }

      if (onClose) {
        onClose(state.deps!).then(() => done());
      } else {
        done();
      }
    });
  });

  return () => {
    if (!state.server) throw new Error("Could not build server.");
    if (!state.deps) throw new Error("Could not build depdendencies.");

    return [state.server, state.deps];
  };
};
