import React from "react";
import { LogArgument } from "../hooks/use-app";

type StyledValueProps = {
  logArgument: LogArgument;
};

const StyledValue = ({ logArgument }: StyledValueProps) => {
  const { dataType, value } = logArgument;

  if (logArgument.dataType === "array") {
    return (
      <span className="type-array">
        [
          {logArgument.value.map((item, index) => (
            <React.Fragment key={index}>
              <StyledValue logArgument={item} />
              {index < (value as LogArgument[]).length - 1 && ", "}
            </React.Fragment>
          ))}
        ]
      </span>
    );
  }

  if (logArgument.dataType === "object") {
    const entries = Object.entries(logArgument.value);

    return (
      <span className="type-object">
        {"{"}
          {entries.map(([key, val], index) => (
            <React.Fragment key={key}>
              <span className="key">{key}</span>: <StyledValue logArgument={val} />
              {index < entries.length - 1 && ", "}
            </React.Fragment>
          ))}
        {"}"}
      </span>
    );
  }

  if (logArgument.dataType === "circular") {
    return <span className="type-circular">{logArgument.value}</span>;
  }

  return <span className={`type-${dataType}`}>{logArgument.value}</span>;
};

export default StyledValue;
