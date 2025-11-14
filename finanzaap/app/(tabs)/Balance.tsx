import { Platform } from "react-native";
import BalanceNative from "./Balance.native";
import BalanceWeb from "./Balance.web";


export default function Balance() {
  if (Platform.OS === "web") {
    return <BalanceWeb />;
  }
  return <BalanceNative />;
}
