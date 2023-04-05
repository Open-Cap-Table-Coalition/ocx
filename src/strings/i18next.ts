import i18next from "i18next";
import us from "./us";
import ca from "./ca";

i18next.init({
  lng: "en-US",
  resources: {
    "en-US": us,
    "en-CA": ca,
  },
});

export default i18next;
