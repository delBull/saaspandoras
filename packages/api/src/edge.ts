import { authRouter } from "./router/auth";
import { customerRouter } from "./router/customer";
import { helloRouter } from "./router/health_check";
import { k8sRouter } from "./router/k8s";
import { createTRPCRouter } from "./trpc";

export const edgeRouter = createTRPCRouter({
  hello: helloRouter,
  k8s: k8sRouter,
  auth: authRouter,
  customer: customerRouter,
});
