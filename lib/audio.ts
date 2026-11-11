/**
 * Web Audio Engine for Hospital MEGA Code Clock
 * 
 * รองรับ:
 * 1. CPR Metronome 110 BPM (AHA guideline 100-120/min)
 * 2. เสียงเตือนครบ 2 นาที CPR Cycle (Double Beep Alert)
 * 3. เสียงยืนยันการกดบันทึกหัตถการ (Clinical Confirmation Chime)
 * 4. เสียงบันทึกยา / ช็อกไฟฟ้า (High Priority Alert)
 * 5. เสียง ROSC (Triumphant Chime)
 */

class HospitalAudioEngine {
  private ctx: AudioContext | null = null;
  private metronomeTimer: number | null = null;
  private isMetronomeActive: boolean = false;
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy initialize on first user gesture
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled && this.isMetronomeActive) {
      this.stopMetronome();
    }
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public playTone(freq: number, durationMs: number = 80, type: OscillatorType = "sine", volume: number = 0.15) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
    } catch {
      // Audio not permitted yet
    }
  }

  // เสียงยืนยันการบันทึกหัตถการทั่วไป (E5 -> A5)
  public playStampChime() {
    this.playTone(659, 90, "sine", 0.18);
    setTimeout(() => this.playTone(880, 120, "sine", 0.18), 80);
  }

  // เสียงแจ้งเตือนเริ่มรอบใหม่ หรือเริ่ม CPR
  public playNewRoundChime() {
    this.playTone(523, 100, "triangle", 0.2); // C5
    setTimeout(() => this.playTone(659, 100, "triangle", 0.2), 100); // E5
    setTimeout(() => this.playTone(784, 180, "triangle", 0.22), 200); // G5
  }

  // เสียงเตือนครบ 2 นาที CPR Cycle (Double Beep Alert ติ๊ด-ติ๊ด)
  public playCycleAlert() {
    this.playTone(987, 120, "square", 0.25); // B5
    setTimeout(() => this.playTone(987, 180, "square", 0.25), 140);
  }

  // เสียงช็อกไฟฟ้า Defib (Shock Alert)
  public playShockAlert() {
    this.playTone(440, 100, "sawtooth", 0.25);
    setTimeout(() => this.playTone(880, 200, "sawtooth", 0.3), 100);
  }

  // เสียงให้ยาฉุกเฉิน (Medication Alert)
  public playDrugAlert() {
    this.playTone(784, 80, "sine", 0.2);
    setTimeout(() => this.playTone(1046, 120, "sine", 0.2), 90);
  }

  // เสียง ROSC สัญญาณชีพกลับมา (Major Arpeggio C-E-G-C)
  public playRoscChime() {
    this.playTone(523, 120, "sine", 0.22);
    setTimeout(() => this.playTone(659, 120, "sine", 0.22), 120);
    setTimeout(() => this.playTone(784, 120, "sine", 0.22), 240);
    setTimeout(() => this.playTone(1046, 260, "sine", 0.25), 360);
  }

  // ==========================================
  // CPR Metronome: 110 BPM (AHA standard)
  // ==========================================
  public startMetronome(onTick?: (beatCount: number) => void) {
    if (this.isMetronomeActive) return;
    this.isMetronomeActive = true;
    let beat = 0;
    const intervalMs = Math.round(60000 / 110); // ~545ms

    this.playTone(1200, 25, "triangle", 0.12); // First tick immediately
    if (onTick) onTick(beat++);

    this.metronomeTimer = window.setInterval(() => {
      this.playTone(beat % 4 === 0 ? 1200 : 900, 25, "triangle", 0.12);
      if (onTick) onTick(beat);
      beat++;
    }, intervalMs);
  }

  public stopMetronome() {
    if (this.metronomeTimer !== null) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
    this.isMetronomeActive = false;
  }

  public isMetronomeRunning(): boolean {
    return this.isMetronomeActive;
  }
}

export const hospitalAudio = new HospitalAudioEngine();
