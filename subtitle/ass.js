import path from "path";
import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
import { print } from "../infra/protocol.js";

import { getFiles, readText, writeText, displayPath } from "../utils/file.js";

export function adjustAssTimeline(input, delta, options = {}) {
  input = assertNonBlank(input, "input");
  delta = assertNonBlank(delta, "delta");

  const deltaCs = deltaToCs(delta);

  const files = getFiles(input, ".ass");

  let processed = 0;
  const total = files.length;
  for (const file of files) {
    adjustAssFileTimeline(file, deltaCs);
    processed++;
    print(`(${processed}/${total}) ${displayPath(file, options)}`, options);
  }

  return {
    files,
  };
}

function adjustAssFileTimeline(file, deltaCs) {
  const text = readText(file);

  const output = text
    .split(/\r?\n/)
    .map((line) => adjustDialogueTimeline(line, deltaCs))
    .join("\n");

  writeText(file, output);
}

function adjustDialogueTimeline(line, deltaCs) {
  const match = line.match(
    /^(Dialogue:[^,]*,)(\d+:\d{2}:\d{2}\.\d{2}),(\d+:\d{2}:\d{2}\.\d{2})(,.*)$/,
  );

  if (!match) {
    return line;
  }

  const [, prefix, startTime, endTime, suffix] = match;

  const start = csToTime(timeToCs(startTime) + deltaCs);

  const end = csToTime(timeToCs(endTime) + deltaCs);

  return `${prefix}${start},${end}${suffix}`;
}

function deltaToCs(delta) {
  const value = Number(delta);

  if (!Number.isFinite(value)) {
    throw createError(ERROR_CODE.INVALID_ARGUMENT, `invalid delta: ${delta}`);
  }

  return Math.round(value * 100);
}

function timeToCs(time) {
  const [hms, cs] = time.split(".");
  const [h, m, s] = hms.split(":");

  return Number(h) * 360000 + Number(m) * 6000 + Number(s) * 100 + Number(cs);
}

function csToTime(cs) {
  cs = Math.max(0, cs);

  const h = Math.floor(cs / 360000);
  cs %= 360000;

  const m = Math.floor(cs / 6000);
  cs %= 6000;

  const s = Math.floor(cs / 100);
  cs = cs % 100;

  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
