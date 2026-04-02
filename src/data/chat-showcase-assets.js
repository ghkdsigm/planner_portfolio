import projectAssistant from "../assets/images/project-assistant.svg";
import projectChallenge from "../assets/images/project03.png";
import panorama from "../assets/images/panorama.png";
import com01 from "../assets/images/com01.jpg";
import com02 from "../assets/images/com02.jpg";
import com04 from "../assets/images/com04.jpg";
import com05 from "../assets/images/com05.jpg";
import com06 from "../assets/images/com06.jpg";
import com07 from "../assets/images/com07.jpg";
import com10 from "../assets/images/com10.jpg";
import com11 from "../assets/images/com11.jpg";
import project01Slide01 from "../assets/images/deep/pj01_01.jpg";
import project01Slide02 from "../assets/images/deep/pj01_02.jpg";
import project01Slide03 from "../assets/images/deep/pj01_03.jpg";
import project01Slide04 from "../assets/images/deep/pj01_04.jpg";
import project02Slide01 from "../assets/images/deep/pj02_01.jpg";
import project02Slide02 from "../assets/images/deep/pj02_02.jpg";
import project02Slide03 from "../assets/images/deep/pj02_03.jpg";
import project02Slide04 from "../assets/images/deep/pj02_04.jpg";
import project03Slide01 from "../assets/images/deep/pj03_01.jpg";
import project03Slide02 from "../assets/images/deep/pj03_02.jpg";
import project03Slide03 from "../assets/images/deep/pj03_03.jpg";
import project03Slide04 from "../assets/images/deep/pj03_04.jpg";
import daopSlide01 from "../assets/images/daop01.png";
import daopSlide02 from "../assets/images/daop02.png";
import daopSlide03 from "../assets/images/daop03.png";
import daopSlide04 from "../assets/images/daop04.png";
import daopSlide05 from "../assets/images/daop05.png";
import daopSlide06 from "../assets/images/daop06.jpg";

const projectVisualMap = {
  "reference-dw-brain": {
    thumbnail: projectAssistant,
    slides: [project01Slide01, project01Slide02, project01Slide03, project01Slide04],
  },
  "reference-panorama": {
    thumbnail: panorama,
    slides: [project02Slide01, project02Slide02, project02Slide03, project02Slide04],
  },
  "reference-carmate": {
    thumbnail: projectChallenge,
    slides: [project03Slide01, project03Slide02, project03Slide03, project03Slide04],
  },
  "reference-daop": {
    thumbnail: projectAssistant,
    slides: [daopSlide01, daopSlide02, daopSlide03, daopSlide04, daopSlide05, daopSlide06],
  },
};

const peopleVisualMap = {
  "with-colleague-1": com01,
  "with-colleague-2": com02,
  "with-colleague-3": com04,
  "with-colleague-4": com05,
  "with-colleague-5": com06,
  "with-colleague-6": com07,
  "with-colleague-7": com10,
  "with-colleague-8": com11,
};

export function resolveChatProjectVisual(id) {
  return projectVisualMap[id] || { thumbnail: "", slides: [] };
}

export function resolveChatPeopleVisual(id) {
  return peopleVisualMap[id] || "";
}
