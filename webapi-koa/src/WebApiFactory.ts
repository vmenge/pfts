import { Server } from "http";
import { WebApi } from "./WebApi";

type TestAppState = {
  busy?: boolean;
  server?: Server;
};

type TestWebApiSettings<T> = {
  builder: WebApi<T>;
  dependencies: T;
  onClose?: (dependencies: T) => Promise<void>;
};

export const useTestWebApi = <T>({
  builder,
  dependencies,
  onClose,
}: TestWebApiSettings<T>): (() => Server) => {
  const state: TestAppState = {
    busy: undefined,
    server: undefined,
  };

  beforeAll(done => {
    if (state.busy) {
      done();
      return;
    }

    state.busy = true;
    state.server = builder.build(dependencies).listen();
    done();
  });

  afterAll(done => {
    state.server?.close(err => {
      if (err) {
        console.error(`Something went wrong when closing the test server: ${err}`);
      }

      if (onClose) {
        onClose(dependencies).then(() => done());
      } else {
        done();
      }
    });
  });

  return () => state.server!;
};
