/**
 * ملف التعامل مع تحويل النص إلى كلام
 */

const SpeechSynthesisService = {
    synth: window.speechSynthesis,
    voice: null,
    isSpeaking: false,
    onStartCallback: null,
    onEndCallback: null,
    onErrorCallback: null,
    
    init: function() {
        if (!this.synth) {
            console.error('تحويل النص إلى كلام غير مدعوم في هذا المتصفح');
            return false;
        }
        
        // الحصول على الأصوات المتاحة
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        }
        
        return true;
    },
    
    loadVoices: function() {
        const voices = this.synth.getVoices();
        
        // محاولة العثور على صوت عربي أنثوي
        let arabicVoice = voices.find(voice => 
            voice.lang.includes('ar') && voice.name.toLowerCase().includes('female'));
        
        // إذا لم يتم العثور على صوت أنثوي، ابحث عن أي صوت عربي
        if (!arabicVoice) {
            arabicVoice = voices.find(voice => voice.lang.includes('ar'));
        }
        
        // إذا لم يتم العثور على صوت عربي، استخدم الصوت الافتراضي
        this.voice = arabicVoice || voices[0];
        
        console.log('تم تحديد الصوت:', this.voice ? this.voice.name : 'الصوت الافتراضي');
    },
    
    speak: function(text) {
        if (!this.synth) {
            console.error('تحويل النص إلى كلام غير مدعوم');
            return false;
        }
        
        // إيقاف أي كلام سابق
        this.stop();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.lang = 'ar-EG';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('بدأ الكلام');
            
            if (this.onStartCallback) {
                this.onStartCallback();
            }
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            console.log('انتهى الكلام');
            
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        };
        
        utterance.onerror = (event) => {
            console.error('خطأ في الكلام:', event);
            this.isSpeaking = false;
            
            if (this.onErrorCallback) {
                this.onErrorCallback(event);
            }
        };
        
        this.synth.speak(utterance);
        return true;
    },
    
    stop: function() {
        if (this.synth && this.isSpeaking) {
            this.synth.cancel();
            this.isSpeaking = false;
            console.log('تم إيقاف الكلام');
        }
    },
    
    onStart: function(callback) {
        this.onStartCallback = callback;
    },
    
    onEnd: function(callback) {
        this.onEndCallback = callback;
    },
    
    onError: function(callback) {
        this.onErrorCallback = callback;
    }
};