#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./app.js";

const man = `
	Usage
	  $ npm init @pmndrs [dst]
`;

const cli = meow(man, {
  importMeta: import.meta,
});
const [dst] = cli.input;

render(<App dst={dst} />);
