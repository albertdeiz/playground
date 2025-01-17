import StyledValue from "../components/styled-value";
import { LogData } from "../hooks/use-playground";
import { usePlayGroundContext } from "../hooks/use-playground-context";
import { LogArgument } from "../utils/log-parser.util";

type LogLine = LogArgument[][];

const parseLogs = (data: LogData[], linesCount: number): LogLine[] => {
  const logs = Array.from({ length: linesCount }, (_, i) => {
    i += 1;

    const logLine = data.filter((d) => d.line === i);

    return logLine.map((log) => log.args ?? []);
  });

  return logs;
};

export const LogsContainer = () => {
  const { lineCount, logs, scrollTop } = usePlayGroundContext();

  return (
    <div
      className="absolute top-0 w-full left-0 text-white flex-1"
      style={{
        transform: `translateY(-${scrollTop}px)`,
      }}
    >
      {parseLogs(logs, lineCount).map((lineLog, i) => (
        <p
          key={i}
          className="text-sm"
          style={{
            height: "21px",
            borderBottom: "1px solid rgba(255,255,255, 0.1)",
          }}
        >
          {lineLog.map((log, i) =>
            log.map((logArgument) => (
              <code key={i} className="whitespace-pre">
                <StyledValue logArgument={logArgument} />
              </code>
            ))
          )}
        </p>
      ))}
    </div>
  );
};
