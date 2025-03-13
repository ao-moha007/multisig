const  dotenv = require("dotenv");
dotenv.config();
function main() {
   console.log(process.env.MY_TENDERLY_KEY);
}
main();