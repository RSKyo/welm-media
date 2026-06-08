import { run } from "./infra/protocol.js";
import { ClientError, ERROR_CODE } from "./infra/error.js";
import { ACTION_COMMANDS } from "./cmd/action.js";
import { DOM_COMMANDS } from "./cmd/dom.js";
import { EMU_COMMANDS } from "./cmd/emu.js";
import { INPUT_COMMANDS } from "./cmd/input.js";
import { PAGE_COMMANDS } from "./cmd/page.js";
import { TARGET_COMMANDS } from "./cmd/target.js";
import { WAIT_COMMANDS } from "./cmd/wait.js";

// 一级命令分组
const COMMAND_GROUPS = {
  action: ACTION_COMMANDS,
  chrome: CHROME_COMMANDS,
  dom: DOM_COMMANDS,
  emu: EMU_COMMANDS,
  input: INPUT_COMMANDS,
  screenshot: SCREENSHOT_COMMANDS,
  target: TARGET_COMMANDS,
  wait: WAIT_COMMANDS,
  
};

// node cmd.js <commandGroup> <commandName> [...args] [--options]

run(async () => {
  const {
    execute,
    argv,
    options,
    groupName,
    commandName,
    command,
  } = resolveCommand(process.argv, COMMAND_GROUPS);

  return await execute({
    groupName,
    commandName,
    argv,
    options,
    command,
  });
});

function resolveCommand(processArgv, commandGroups) {
  const [, , groupName, commandName, ...rest] = processArgv;

  const groupNames = Object.keys(commandGroups).join(", ");

  if (!groupName) {
    throw new ClientError(
      ERROR_CODE.MISSING_CMD,
      `missing command group, expected one of: ${groupNames}`,
    );
  }

  if (!Object.hasOwn(commandGroups, groupName)) {
    throw new ClientError(
      ERROR_CODE.INVALID_CMD,
      `unknown command group: ${groupName}, expected one of: ${groupNames}`,
    );
  }

  const group = commandGroups[groupName];
  const commandNames = Object.keys(group).join(", ");

  if (!commandName) {
    throw new ClientError(
      ERROR_CODE.MISSING_CMD,
      `missing command, expected one of: ${commandNames}`,
    );
  }

  if (!Object.hasOwn(group, commandName)) {
    throw new ClientError(
      ERROR_CODE.INVALID_CMD,
      `unknown command: ${commandName}, expected one of: ${commandNames}`,
    );
  }

  const command = group[commandName];

  if (!command || typeof command.handler !== "function") {
    throw new ClientError(
      ERROR_CODE.INVALID_CMD,
      `invalid command handler: ${groupName} ${commandName}`,
    );
  }

  const { argv, options } = splitArgvAndOptions(rest);

  return {
    groupName,
    commandName,

    argv,
    options,

    group,
    command,

    execute: command.handler,
  };
}

function splitArgvAndOptions(input = []) {
  const argv = [];
  const options = {};

  for (const part of input) {
    if (part.startsWith("--")) {
      const body = part.slice(2);
      const eqIndex = body.indexOf("=");

      if (eqIndex === -1) {
        options[body] = true;
        continue;
      }

      const key = body.slice(0, eqIndex);
      const value = body.slice(eqIndex + 1);

      options[key] = value;
      continue;
    }

    argv.push(part);
  }

  return { argv, options };
}