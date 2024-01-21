import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { getStoreData, getNonce, getAsWebviewUri, setHistoryData, getVSCodeUri, getHistoryData, setChatData, getChatData } from "../utilities/utility.service";
import { askToChatGpt, askToChatGptAsStream } from "../utilities/chat-gpt-api.service";

/**
 * Webview panel class
 */
export class ChatGptPanel {
    public static currentPanel: ChatGptPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _context: vscode.ExtensionContext;

    // declare an array for search history.
    private searchHistory: string[] = [];

    /**
     * Constructor
     * @param context :vscode.ExtensionContext.
     * @param panel :vscode.WebviewPanel.
     * @param extensionUri :vscode.Uri.
     */
    private constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._context = context;
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);

        this.sendHistoryAgain();

        //clear chat
        setChatData(this._context, []);
    }

    /**
     * Render method of webview that is triggered from "extension.ts" file.
     * @param context :vscode.ExtensionContext.
    */
    public static render(context: vscode.ExtensionContext) {
        // if exist show 
        if (ChatGptPanel.currentPanel) {
            ChatGptPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {

            // if not exist create a new one.
            const extensionUri: vscode.Uri = context.extensionUri;
            const panel = vscode.window.createWebviewPanel("vscode-chat-gpt", "Ask To Chat Gpt", vscode.ViewColumn.One, {
                // Enable javascript in the webview.
                enableScripts: true,
                // Restrict the webview to only load resources from the `out` directory.
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')],
                // retain info when panel is hidden
                retainContextWhenHidden: true
            });

            const logoMainPath = getVSCodeUri(extensionUri, ['out/media', 'chat-gpt-logo.jpeg']);
            const icon = {
                "light": logoMainPath,
                "dark": logoMainPath
            };
            panel.iconPath = icon;

            ChatGptPanel.currentPanel = new ChatGptPanel(context, panel, extensionUri);
        }

        const historyData = getHistoryData(context);
        ChatGptPanel.currentPanel._panel.webview.postMessage({ command: 'history-data', data: historyData });
    }

    /**
     * Dispose panel.
     */
    public dispose() {
        ChatGptPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Add listeners to catch messages from mainview js.
     * @param webview :vscode.Webview.
     */
    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: any) => {
                const command = message.command;

                switch (command) {
                    case "press-ask-button":
                        let instrucions = await this.getInstuctionSet();
                        if (instrucions.length > 120000) {
                            vscode.window.showInformationMessage('Instrucitons too long');
                            return;
                        }
                        this._askToChatGpt(message.data, instrucions);
                        this.addHistoryToStore(message.data);
                        return;
                    case "press-ask-no-instr-button":
                        this._askToChatGpt(message.data);
                        this.addHistoryToStore(message.data);
                        return;
                    case "history-question-clicked":
                        this.clickHistoryQuestion(message.data);
                        break;
                    case "history-request":
                        this.sendHistoryAgain();
                        break;
                    case "clear-history":
                        this.clearHistory();
                        break;
                    case "clear-chat":
                        this.clearChat();
                        break;
                    case "show-instructions-set":
                        await this.showInstuctionSet();
                        break;
                }
            },
            undefined,
            this._disposables
        );
    }

    /**
     * Gets Html content of webview panel.
     * @param webview :vscode.Webview.
     * @param extensionUri :vscode.Uri.
     * @returns string;
     */
    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {

        // get uris from out directory based on vscode.extensionUri
        const webviewUri = getAsWebviewUri(webview, extensionUri, ["out", "mainview.js"]);
        const nonce = getNonce();
        const styleVSCodeUri = getAsWebviewUri(webview, extensionUri, ['out/media', 'vscode.css']);
        const logoMainPath = getAsWebviewUri(webview, extensionUri, ['out/media', 'chat-gpt-logo.jpeg']);

        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'self' 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
            <link href="${styleVSCodeUri}" rel="stylesheet">
            <link rel="icon" type="image/jpeg" href="${logoMainPath}">
          </head>
          <body>        
          <div class="content-container">  
          <div class="top-section">
            <p id="history-header" class="answer-header" style="display:none"> Question History: </p>   
            <ul id="history-id"  style="display:none">
			</ul>
            <p id="instructions-header" class="answer-header" style="display:none"> Instructions: </p>   
            <pre class="pre"><code class="code instructions" id="instructions-id" style="display:none"></code></pre>
            <p class="answer-header"> Chat: </p>            
            <pre class="pre"><code class="code" id="answers-id"></code></pre>
            </div>
            <div class="bottom-section">
            <vscode-text-area class="text-area mt-20" id="question-text-id" cols="100">Question:</vscode-text-area>
            <div class="flex-container" style="margin-bottom:15px">
              <vscode-button id="ask-button-id">Ask</vscode-button>
              <vscode-button id="ask-no-instructions-button-id">Ask (No instructions)</vscode-button>
              <vscode-button class="danger" id="clear-button-id">Clear</vscode-button>
              <vscode-button class="grayish" id="show-history-button">Show History</vscode-button>
              <vscode-button class="grayish" id="clear-history-button">Clear History</vscode-button>
              <vscode-button id="show-instructions-button" class="instruction-button">Show Instructions</vscode-button>
              <div id="instructions-character-count"></div>
              <vscode-progress-ring id="progress-ring-id" class="progress-ring"></vscode-progress-ring>
            </div>
            <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
          </body>
        </html>
        `;
    }

    /**
     * Ask history question to ChatGpt and send 'history-question-clicked' command with data to mainview.js.
     * @param hisrtoryQuestion :string
     */
    public clickHistoryQuestion(hisrtoryQuestion: string) {
        this._askToChatGpt(hisrtoryQuestion);
    }

    public sendHistoryAgain() {
        const historyData = getHistoryData(this._context);
        this._panel.webview.postMessage({ command: 'history-data', data: historyData });
    }

    /**
     * Ask to ChatGpt a question ans send 'answer' command with data to mainview.js.
     * @param question :string
     */
    private _askToChatGpt(question: string, system_content: string = "") {
        if (question == undefined || question == null || question == '') {
            vscode.window.showInformationMessage('Please enter a question!');
            return;
        }
        const storeData = getStoreData(this._context);
        const existApiKey = storeData.apiKey;
        const existTemperature = storeData.temperature;
        var asssistantResponse = { role: "assistant", content: '' };
        if (existApiKey == undefined || existApiKey == null || existApiKey == '') {
            vscode.window.showInformationMessage('Please add your ChatGpt api key!');
        } else if (existTemperature == undefined || existTemperature == null || existTemperature == 0) {
            vscode.window.showInformationMessage('Please add temperature!');
        }
        else {
            // make the message
            let questionMessage = { role: "user", content: question };
            // get previous messages
            let messages = getChatData(this._context);
            //if it's empty this is where we add the system message
            if (messages.length == 0) {
                if (system_content != "") {
                    messages.push({ role: "system", content: system_content });
                }
            }
            messages.push(questionMessage);
            setChatData(this._context, messages);
            askToChatGptAsStream(messages, existApiKey, existTemperature).subscribe(answer => {
                //check for 'END MESSAGE' string, 
                if (answer == 'END MESSAGE') {
                    var chatData = getChatData(this._context);
                    chatData.push(asssistantResponse);
                    setChatData(this._context, chatData);
                } else {
                    asssistantResponse.content += answer;
                    ChatGptPanel.currentPanel?._panel.webview.postMessage({ command: 'answer', data: answer });
                }
            });
        }
    }

    clearHistory() {
        this.searchHistory = [];
        setHistoryData(this._context, this.searchHistory);
    }

    clearChat() {
        setChatData(this._context, []);
    }

    addHistoryToStore(question: string) {
        this.searchHistory = getHistoryData(this._context);
        this.searchHistory.push(question);
        setHistoryData(this._context, this.searchHistory);
    }

    getHistoryFromStore() {
        const history = getHistoryData(this._context);
        return history;
    }

    private async getSummary(variables: string, text: string): Promise<string> {
        const params = variables.split(',');
        const name = params[0];
        let orig_ratio = params.length > 1 ? params[1].trim() : '1/10';
        let ratio = orig_ratio.replace('1/', 'one_in_');
        let workspacePath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        const summaryDirPath = path.join(workspacePath, '.vscode', 'summaries');
        const summarySourceDirPath = path.join(workspacePath, '.vscode', 'summary_sources');

        // Ensure the directories exist
        if (!fs.existsSync(summaryDirPath)) {
            fs.mkdirSync(summaryDirPath, { recursive: true });
        }
        if (!fs.existsSync(summarySourceDirPath)) {
            fs.mkdirSync(summarySourceDirPath, { recursive: true });
        }


        const summaryFilePath = path.join(summaryDirPath, `${name}_${ratio}.md`);
        const summarySourcePath = path.join(summarySourceDirPath, `${name}_${ratio}.md`);

        if (!fs.existsSync(summarySourcePath) || fs.readFileSync(summarySourcePath, 'utf8') !== text || !fs.existsSync(summaryFilePath)) {
            // Update the summary
            fs.writeFileSync(summarySourcePath, text);
            const storeData = getStoreData(this._context);
            const summary = await askToChatGpt(`Please summarize the following text: '''${text}''' The length of the summary should be ${orig_ratio} of the original text. Output only the summary but keep the title.  Following the title add in parenthesis (Summary ratio ${orig_ratio}) to indicate this is a summary. You can use markdown to format the summary.`, storeData.apiKey);
            fs.writeFileSync(summaryFilePath, summary);
        }

        return fs.readFileSync(summaryFilePath, 'utf8');
    }

    private async processInstructionsFile(): Promise<void> {
        const summarizeRegex = /@summarize\((.*?)\)\s([\s\S]*?)@end-summarize/g;

        const inputFilename = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'instructions.md');
        const outputFilename = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'instructions-processed.md');
        const content = fs.readFileSync(inputFilename, 'utf8'); let processedContent = content;
        const matches = [...content.matchAll(summarizeRegex)];

        for (const match of matches) {
            if (match[0]) {
                const summary = await this.getSummary(match[1], match[2]);
                processedContent = processedContent.replace(match[0], summary + '\n');
            }
        }

        fs.writeFileSync(outputFilename, processedContent);
    }

    private async getInstuctionSet(): Promise<string> {

        await this.processInstructionsFile();
        //read instructions from file .vscode/instructions.md from the workspaceFolder
        const filePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'instructions-processed.md');
        var instructions = 'No instructions found!';
        instructions = fs.readFileSync(filePath, 'utf8');
        this._panel.webview.postMessage({ command: 'upadate-instructions-character-count', data: instructions.length });
        return instructions;
    }

    async showInstuctionSet() {
        this._panel.webview.postMessage({ command: 'instructions-data', data: await this.getInstuctionSet() });
    }

}