---
title: Polkadot
sidebar_position: 3
description: How to configure the Polkadot{.js} Substrate wallet for the Autonomys Network
slug: /wallets/polkadot
keywords:
    - Farmer
    - Farming
    - CLI
    - polkadot.js
    - Wallet
---

:::note

polkadot.js extension is a Substrate/EVM wallet created by the creators of Substrate & Polkadot/Kusama the [Parity Team](https://www.parity.io/).

:::

This is the barebones wallet. This is because it is a wallet that supports all Substrate based networks. This is an extension that works similarly to MetaMask, or most other browser based wallets you’ve likely used in the past.

## Create a New Wallet

1. Visit the [Polkadot.js](https://polkadot.js.org/extension/) Website and Download your respective version. 

:::tip
The Chrome option will work on all Chromium based browsers such as Brave, Vivaldi, & Edge
:::

2. Once extension is installed, Open it. Read the notes. 

    ![step-2](/img/doc-imgs/polkadot/Polkadot-1.png)

3. Click on + to add a new account. 

    ![step-3](/img/doc-imgs/polkadot/Polkadot-2.png)

4. The extension will then show you your 12-word mnemonic seed.

:::danger
MAKE SURE YOU STORE THIS SECURELY, AND NEVER SHARE IT
:::

![step-4](/img/doc-imgs/polkadot/Polkadot-3.png)

5. Once your seed is securely stored and saved, click the “I have saved my mnemonic seed safely” check box and click “Next Step”

6. The next step will ask for a Name & Password for the wallet. then click “Add the account with the generated seed”

    ![step-6](/img/doc-imgs/polkadot/Polkadot-4.png)

7. Congratulations you have created a polkadot.js wallet!

    ![step-7](/img/doc-imgs/polkadot/Polkadot-5.png)


## Importing an Existing Seed

Some users may be provided an existing mnemonic seed phrase that may have been provided by Subspace-Desktop, if this is the case you will want to follow this portion of the guide.

1. Install the Extension (See [step 1](#create-a-new-wallet) of the previous section)

2. Once extension is installed, Open it and click `+`, & `Import account from pre-existing seed`

    ![step-2a](/img/doc-imgs/polkadot/step-2a.png)

3. Type or Paste in your 12-Word mnemonic seed phrase & click `Next`

    ![step-3a](/img/doc-imgs/polkadot/step-3a.png)

4. The next step will ask for a Name & Password for the wallet. then click `Add the account with the supplied seed`

    ![step-4a](/img/doc-imgs/polkadot/step-4a.png)


## Troubleshooting

If you face any trouble or would like to learn about other features for Polkadot.js, please see the [Official Polkadot.js Documentation](https://polkadot.js.org/). We have included some basic FAQ's below.

### How can I find my Public Address?
- You can see your default substrate public address right below your Wallet name inside the extension

    ![trouble-1](/img/doc-imgs/polkadot/trouble-1.png)

- You can see your Autonomys mainnet public address via the `...` menu and setting the `Allow Use on Any Chain` dropdown to `Autonomys mainnet`, once you exit you will see the public address now starts with `su`

    ![trouble-2](/img/doc-imgs/polkadot/trouble-2.png)

    ![trouble-10](/img/doc-imgs/polkadot/trouble-10.png)

### I Don't See `Autonomys mainnet` or Any Autonomys Networks as an Option in Chain Settings

- As seen below, sometimes when you first install or update the Substrate wallet you will need to update the wallet metadata.

    ![trouble-3](/img/doc-imgs/polkadot/trouble-3.png)

1. Go to the Subspace/Polkadot Explorer here: [Polkadot/Substrate Portal](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.mainnet.subspace.foundation%2Fws#/explorer)

2. You will be prompted to allow the extension to connect, Select desired account(s),click `Connect 1 account(s)`

    ![trouble-4](/img/doc-imgs/polkadot/trouble-4.png)

3. On the Webpage, click `settings`

    ![trouble-5](/img/doc-imgs/polkadot/trouble-5.png)

4. Click `Metadata`

    ![trouble-6](/img/doc-imgs/polkadot/trouble-6.png)

5. Click `Update Metadata`

    ![trouble-7](/img/doc-imgs/polkadot/trouble-7.png)

6. You will get a popup from the extension asking you to confirm click `Yes, do this metadata update` 

    ![trouble-8](/img/doc-imgs/polkadot/trouble-8.png)

7. You will now see `Autonomys mainnet` as an option on the `Allow use on any chain` dropdown. 

    ![trouble-9](/img/doc-imgs/polkadot/trouble-9.png)

### How Do I Backup my Wallet?

1. You can backup/export your wallet via the `...` menu, then click `Export Account`

    ![trouble-11](/img/doc-imgs/polkadot/trouble-11.png)

2. You will then enter your wallet password and click `I want to export this account`

    ![trouble-12](/img/doc-imgs/polkadot/trouble-12.png)
