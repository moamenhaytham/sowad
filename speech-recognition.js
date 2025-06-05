/**
 * ملف التعامل مع التعرف على الكلام
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

const SpeechRecognitionService = {
    recognition: null,
    isListening: false,
    transcript: '',
    onResultCallback: null,
    onEndCallback: null,
    onErrorCallback: null,
    
    init: function() {
        if (!SpeechRecognition) {
            console.error('التعرف على الكلام غير مدعوم في هذا المتصفح');
            return false;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ar-EG';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        
        this.setupEventListeners();
        return true;
    },
    
    setupEventListeners: function() {
        this.recognition.onresult = (event) => {
            this.transcript = event.results[0][0].transcript;
            console.log('تم التعرف على: ', this.transcript);
            
            if (this.onResultCallback) {
                this.onResultCallback(this.transcript);
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            console.log('انتهى التعرف على الكلام');
            
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('خطأ في التعرف على الكلام:', event.error);
            this.isListening = false;
            
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
        };
    },
    
    start: function() {
        if (!this.recognition) {
            console.error('لم يتم تهيئة خدمة التعرف على الكلام');
            return false;
        }
        
        try {
            this.recognition.start();
            this.isListening = true;
            console.log('بدأ الاستماع...');
            return true;
        } catch (error) {
            console.error('خطأ في بدء التعرف على الكلام:', error);
            return false;
        }
    },
    
    stop: function() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            console.log('تم إيقاف الاستماع');
        }
    },
    
    onResult: function(callback) {
        this.onResultCallback = callback;
    },
    
    onEnd: function(callback) {
        this.onEndCallback = callback;
    },
    
    onError: function(callback) {
        this.onErrorCallback = callback;
    }
};