export function getAddress(address: String) {
    return address.slice(0, 4) + "..." + address.slice(28, 32);
}
