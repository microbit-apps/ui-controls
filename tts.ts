
namespace ui.controls.tts {
  const _ttsJacdacModule = modules.speechSynthesis1;
  _ttsJacdacModule.start();
  _ttsJacdacModule.setEnabled(true);

  export function speak(text: string): void {
    _ttsJacdacModule.speak(text);
  }

  /**
   * Speaks a control's focus label, or its display text when it has no focus label.
   */
  export function speakControlText<T>(control: ui.UiControl<T>): void {
    if (control.focusLabel !== undefined)
      speak(control.focusLabel);
    else if (control.text !== undefined)
      speak(control.text);
  }
}
