import { preprocessCode } from "../utils/transpiler.util";

interface Scope {
  console?: {
    log: () => void;
    error: () => void;
  };
}

declare global {
  interface Window {
    console: Scope["console"];
  }
}

export class SandboxManager {
  public iframe: HTMLIFrameElement | null = null;
  private scope: Scope | undefined;
  private script: HTMLScriptElement | undefined;

  constructor(cb: (iframe: HTMLIFrameElement) => Scope) {
    this.createIframe(cb);
  }

  private createIframe(cb: (iframe: HTMLIFrameElement) => Scope): void {
    this.iframe = document.createElement("iframe");
    this.iframe.src = "about:blank";
    this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.iframe.style.display = "none";
    document.body.appendChild(this.iframe);
    this.scope = cb(this.iframe);

    if (this.iframe.contentWindow) {
      this.initializeSandbox();
    }
  }

  private static transformCode(code: string): {
    imports: string[];
    code: string;
  } {
    const importRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"]/g;
    const imports: string[] = [];

    let match = null;
    while ((match = importRegex.exec(code)) !== null) {
      const [, bindings, moduleName] = match;
      const moduleUrl = moduleName;
      imports.push(`import ${bindings} from '${moduleUrl}';`);
    }

    const transpiledCode = preprocessCode(code);

    return { code: transpiledCode.replace(importRegex, "").trim(), imports };
  }

  private initializeSandbox(): void {
    if (!this.iframe?.contentWindow) {
      throw new Error("Iframe no inicializado correctamente.");
    }

    const { document: sandboxDoc } = this.iframe.contentWindow;

    sandboxDoc.open();
    sandboxDoc.write("<!DOCTYPE html><html>");
    sandboxDoc.write("<head></head>");
    sandboxDoc.write("<body>");
    sandboxDoc.write("<div id='app'></div>");
    sandboxDoc.write("</body>");
    sandboxDoc.write("</html>");
    sandboxDoc.close();
  }

  public executeScript(script: string): void {
    if (!this.iframe?.contentWindow) throw new Error("Iframe no disponible.");

    if (this.script) {
      this.script.remove();
    }

    if (this.scope?.console) {
      this.iframe.contentWindow.console = {
        ...this.iframe.contentWindow.console,
        ...this.scope.console,
      };
    }

    this.script = this.iframe.contentWindow.document.createElement("script");
    this.script.type = "module";

    try {
      const { code, imports } = SandboxManager.transformCode(script);

      this.script.textContent = `
        ${imports.join("\n")}
        try {
          ${code}
        } catch(e) {
          console.error(e);
        }`;

      this.iframe.contentWindow.document.body.appendChild(this.script);
    } catch (e) {
      this.iframe.contentWindow?.parent.postMessage(
        { type: "error", stack: e.stack, message: e.message },
        "*"
      );
    }
  }

  public destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }
}
