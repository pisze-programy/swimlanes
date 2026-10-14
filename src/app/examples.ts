import deploy from "../../examples/deploy.sl?raw";
import fullSyntax from "../../examples/full-syntax.sl?raw";
import login from "../../examples/login.sl?raw";
import payment from "../../examples/payment.sl?raw";
import welcome from "../../examples/welcome.sl?raw";

export interface Example {
  readonly id: string;
  readonly title: string;
  readonly source: string;
}

export const examples: readonly Example[] = [
  { id: "welcome", title: "Welcome", source: welcome },
  { id: "full-syntax", title: "Full syntax", source: fullSyntax },
  { id: "login", title: "Sign in", source: login },
  { id: "payment", title: "Payment retry", source: payment },
  { id: "deploy", title: "Deploy", source: deploy },
];

export const defaultSource = welcome;
