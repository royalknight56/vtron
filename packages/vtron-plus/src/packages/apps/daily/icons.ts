import calculatorIcon from '../../assets/calcicon.png';
import notepadIcon from '../../assets/daily/notepad.png';
import snippingIcon from '../../assets/daily/snipping.png';
import stickyIcon from '../../assets/daily/sticky.png';
import recorderIcon from '../../assets/daily/recorder.png';
import clockIcon from '../../assets/daily/clock.png';

export type DailyFeature = 'calc' | 'notepad' | 'snip' | 'sticky' | 'recorder' | 'clock';
export const dailyAppIcons = {
  计算器: calculatorIcon,
  记事本: notepadIcon,
  截图工具: snippingIcon,
  便笺: stickyIcon,
  录音机: recorderIcon,
  闹钟和时钟: clockIcon,
};
