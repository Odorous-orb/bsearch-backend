var metamask_accounts = null;
const {ethereum} = window;
    
const handleAccountsChanged = (accounts) => {
    metamask_accounts = accounts;
    console.log(accounts[0]);
    changeAccount(accounts[0]);    
}
ethereum.on('accountsChanged', handleAccountsChanged)
//ethereum.on('networkChanged', handleNetworkChanged)


async function connect_metamask() {
    metamask_accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    console.log(metamask_accounts[0]);
    changeAccount(metamask_accounts[0])
}

async function personal_sign(msg) {
    const ethResult = await ethereum.request({
        method: 'personal_sign',
        params: [msg, metamask_accounts[0]],
    });
    return ethResult;    
}

