
namespace ui.controls.tts {
  const _ttsJacdacModule = modules.speechSynthesis1;
  _ttsJacdacModule.start();
  _ttsJacdacModule.setEnabled(true);

  /**
   * Speaks a control's focus label, or its display text when it has no focus label.
   */
  export function speakControlText<T>(control: ui.UiControl<T>): void {
    if (control.focusLabel !== undefined)
      _ttsJacdacModule.speak(control.focusLabel);
    else if (control.text !== undefined)
      _ttsJacdacModule.speak(control.text);
  }
}
