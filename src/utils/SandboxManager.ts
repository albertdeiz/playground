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

    this.executeScript = this.executeScript.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  private createIframe(cb: (iframe: HTMLIFrameElement) => Scope): void {
    this.iframe = document.createElement("iframe");
    // this.iframe.style.display = "none";
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

    return { code: code.replace(importRegex, "").trim(), imports };
  }

  private initializeSandbox(): void {
    if (!this.iframe?.contentWindow) {
      throw new Error("Iframe no inicializado correctamente.");
    }

    // "vue-router":        "https://cdnjs.cloudflare.com/ajax/libs/vue-router/4.1.5/vue-router.esm-browser.min.js",
    const sandboxDoc = this.iframe.contentWindow.document;
    sandboxDoc.open();
    sandboxDoc.write(`<!DOCTYPE html><html><head></head><body>
      <div class="app"></div>
      <script type="importmap">
        { "imports": {
          "vue":               "https://unpkg.com/vue@3.2.41/dist/vue.esm-browser.js",
          "vue-router":        "https://unpkg.com/vue-router@4.1.5/dist/vue-router.esm-browser.js",
          "@vue/devtools-api": "https://unpkg.com/@vue/devtools-api@6.4.5/lib/esm/index.js",
          "moment": "https://unpkg.com/moment@2.30.1/dist/moment.js"
        } }
      </script>
      </body></html>`);
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

    const { code, imports } = SandboxManager.transformCode(script);

    const s = JSON.stringify(code);
    this.script.textContent = `
      ${imports.join("\n")}

      try {
        eval(${s})
      } catch(e) {
        console.error(e)
      }
    `;

    this.iframe.contentWindow.document.body.appendChild(this.script);
  }

  public destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
  }
}
