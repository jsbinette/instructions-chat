
# ChatGpt extension for VSCode

This is a chat bot that uses ChatGpt api in VSCode.

After setting your settings(api key, temperature,response number, size ), you can ask what you want or generate images.

The extension is meant to be used with it's sister extension (Instructions by the same author).  Combined together, you can use "long" instructions to accompany your chat bot queries.

When bookmarks @summarize(keyword, ratio) are present, this extension will also summarize the section of the file to incorporate in the instructions.  This is the only bookmark processed in the present extension.

## Appendix

This chat bot uses VSCode api. Your API KEY will be safely stored in your workspace.

## Installation

Install as a regular extension.
This extension is meant to work with it's sister extension (Instructions by the same author).

## Release Notes

- v0.0.1 first relese with simple command and chat panel.
- v0.0.2 Add icon start button on VSCode Activity bar.
- V0.0.3 bugfix updates
- V1.0.0 Add Explorer View and show history of last 10 queries.
- V1.1.0 Add new three commands to VSCode editor context menu. These: ChatGpt Add Comments, ChatGpt Add Documentaions and ChatGpt Refactor.
- V1.1.1 Add conditions to context menu commands.
- V1.1.2 Add temperature settings to chat panel and add editor logo.
- V1.2.0 Add settings panel and image generation tab.
- V1.2.1 skipped
- V1.2.2 Many changes; added instructions, modified the settings, made it work with sister extension (instructions), etc.
-V1.2.3 Changed instruction length, etc.
- V1.2.4 Added progress ring;changed formating, handled missing instructions.
- V1.2.5 Fixed change of data model from OpenAI. Updated model to gpt-4-turbo-preview.
- V1.2.6 create .vscode on the fly if needed, changed model to gpt-4-turbo.

## Using Extension

* Open chat panel.

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/start-and-api-key.gif?raw=true)

* Set api key.

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/extension.png?raw=true)

* Say hello!

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/extension-1.png?raw=true)

* Wite a simple typescript code that find squareroot of a number.

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/extension-2.png?raw=true)

* Click recent query in the history.

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/history-clear.gif?raw=true)

* New Setting Panel.

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/new-ask-gpt.png?raw=true)

* New Image Generate Panel.

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/generate-image.png?raw=true)

* Add comments.
![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/add-comment-1.png?raw=true)

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/add-comment-2.png?raw=true)

* Add documentations.

![alt text](https://github.com/ismailkasan/chat-gpt-vscode-extension/blob/main/src/images/add-documentation-1.png?raw=true)