import bcrypt from "bcrypt";

async function main() {
    const hash = await bcrypt.hash("admin", 10);
    console.log(hash, hash.length);
}

main();