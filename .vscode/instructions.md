        const summarizeRegex = /@summarize\((.*?)\)\s([\s\S]*?)
        const inputFilename = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'instructions.md');
        const outputFilename = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'instructions-processed.md');
        const content = fs.readFileSync(inputFilename, 'utf8'); let processedContent = content;
        const matches = [...content.matchAll(summarizeRegex)];

        for (const match of matches) {
            if (match[0]) {
                const summary = await this.getSummary(match[1], match[2]);
                processedContent = processedContent.replace(match[0], summary);
            }
        }
    }

    private async getInstuctionSet(): Promise<string> {

        await this.processInstructionsFile();
        //read instructions from file .vscode/instructions.md from the workspaceFolder
        const filePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'instructions.md');
        var instructions = 'No instructions found!';
        try {
            instructions = fs.readFileSync(filePath, 'utf8');
        } catch (err) {
        }
        return instructions;
    }

    async showInstuctionSet() {
        this._panel.webview.postMessage({ command: 'instructions-data', data: await this.getInstuctionSet() });
    }

}