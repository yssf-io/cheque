## Cheque - ETHGlobal Brussels

This project lets users pay people by letting the payers share authorizations to receivers to claim their money, like checks but onchain.

Example: Alice wants to give 10 USDC to Bob; she locks the 10 USDC in a smart contract then signs a message specifying the amount; she then shares
that signature to Bob (with a QRCode that Bob can scan with his phone); Bob can now construct an onchain transaction to claim these 10 USDC, however
he wants (just like he would be able to choose whatever bank to cash a check).

Alice doesn't need to know anything about how Bob will claim the money, she can just authorize the claiming. Bob also doesn't need to care about how Alice
transfers the money, he just needs the signature.

### Roadmap

- Cheque App
  - An app that generates a crypto account for you (onboarding screen)
  - Button to "Create Cheque"
    - Lock money in a smart contract
    - Sign authorization
    - Generates QRCode containing the signature (URL-encoded)
  - Balance
  - Bonus: onramp
- Claiming Webapp
  - Decode URL to display the _Cheque_
  - Copy signature button (for tech-savvy users wanting to construct their own transaction)
  - Connect Wallet mobile (?)
  - Claim button if connect wallet mobile works
  - Alternatively, ask the claimer to open the URL on desktop
- Smart Contract
  - `lockUSDC`
  - `claimUSDC`
  - `refund`

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
