# Backup and restore procedure

## Create a backup

1. Open the Personal Vault and enter the Archive.
2. Choose **Create verified backup**.
3. Save to an absolute path on separate storage.
4. Confirm that the receipt shows a non-zero file size and SHA-256 digest.

The implementation delegates writing to Bitcoin Core [`backupwallet`](https://bitcoincore.org/en/doc/31.0.0/rpc/wallet/backupwallet/). Core Vault does not copy wallet database bytes through JavaScript.

## Prove recovery

1. Keep the original wallet loaded.
2. Choose **Test a restore** and give the restored copy a unique temporary name.
3. Select the `.dat` backup.
4. Bitcoin Core [`restorewallet`](https://bitcoincore.org/en/doc/31.0.0/rpc/wallet/restorewallet/) loads the copy.
5. Core Vault hashes sorted public descriptors from both wallets and requires a match.
6. Inspect warnings and unload the temporary restored copy when finished.

A matching public fingerprint proves that the restored wallet describes the same public keyspace. It does not prove that every future operational scenario is safe. Repeat restore tests after material wallet changes and before relying on a backup.

Current limitation: backup receipts are session memory. After an application restart, Core Vault conservatively shows **Backup required** again even though the Core wallet persists.
