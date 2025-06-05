/**
 * الملف الرئيسي للتطبيق
 */

document.addEventListener('DOMContentLoaded', function() {
    // عناصر واجهة المستخدم
    const startBtn = document.getElementById('startBtn');
    const statusIndicator = document.getElementById('statusIndicator');
    const chatContainer = document.getElementById('chatContainer');
    
    // حالة التطبيق
    let isInitialized = false;
    let userName = '';
    let userAskedName = false;
    let userAskedAge = false;
    
    // تهيئة الخدمات
    function initializeServices() {
        // تهيئة خدمة التعرف على الكلام
        const speechRecognitionInitialized = SpeechRecognitionService.init();
        if (!speechRecognitionInitialized) {
            addSaadMessage("عذراً، التعرف على الكلام غير مدعوم في هذا المتصفح. يرجى استخدام متصفح حديث مثل Chrome.");
            return false;
        }
        
        // تهيئة خدمة تحويل النص إلى كلام
        const speechSynthesisInitialized = SpeechSynthesisService.init();
        if (!speechSynthesisInitialized) {
            addSaadMessage("عذراً، تحويل النص إلى كلام غير مدعوم في هذا المتصفح. يرجى استخدام متصفح حديث مثل Chrome.");
            return false;
        }
        
        // تهيئة خدمة Gemini API
        // ملاحظة: يجب استبدال 'YOUR_API_KEY' بمفتاح API الخاص بك
        const geminiApiKey = 'AIzaSyDrVsq5P6ndL9cDJSSWik-HOcL6X6zyVNU'; // قم بتغيير هذا إلى مفتاح API الخاص بك
        const geminiInitialized = GeminiService.init(geminiApiKey);
        if (!geminiInitialized) {
            addSaadMessage("عذراً، حدث خطأ في تهيئة خدمة الذكاء الاصطناعي. يرجى التحقق من مفتاح API.");
            return false;
        }
        
        // إعداد معالجات الأحداث
        setupEventHandlers();
        
        // إعادة تعيين محادثة Gemini
        GeminiService.resetHistory();
        
        return true;
    }
    
    // إعداد معالجات الأحداث
    function setupEventHandlers() {
        // معالج نتيجة التعرف على الكلام
        SpeechRecognitionService.onResult(function(transcript) {
            addUserMessage(transcript);
            processUserInput(transcript);
        });
        
        // معالج انتهاء التعرف على الكلام
        SpeechRecognitionService.onEnd(function() {
            startBtn.classList.remove('listening-animation');
            statusIndicator.textContent = 'جاهزة للاستماع...';
            statusIndicator.classList.remove('listening');
        });
        
        // معالج خطأ التعرف على الكلام
        SpeechRecognitionService.onError(function(error) {
            console.error('خطأ في التعرف على الكلام:', error);
            startBtn.classList.remove('listening-animation');
            statusIndicator.textContent = 'حدث خطأ في الاستماع. حاول مرة أخرى.';
            statusIndicator.classList.remove('listening');
            
            if (error === 'not-allowed') {
                addSaadMessage("يبدو أنك لم تسمح لي باستخدام الميكروفون. يرجى السماح بالوصول إلى الميكروفون لاستخدام سعاد.");
            } else if (error === 'no-speech') {
                addSaadMessage("لم أسمع أي شيء. هل يمكنك التحدث بصوت أعلى قليلاً؟");
            } else {
                addSaadMessage(SAAD_PERSONA.getTechnicalErrorResponse());
            }
        });
        
        // معالج بدء الكلام
        SpeechSynthesisService.onStart(function() {
            statusIndicator.textContent = 'سعاد تتحدث...';
            statusIndicator.classList.add('processing');
        });
        
        // معالج انتهاء الكلام
        SpeechSynthesisService.onEnd(function() {
            statusIndicator.textContent = 'جاهزة للاستماع...';
            statusIndicator.classList.remove('processing');
        });
        
        // معالج نقر زر الميكروفون
        startBtn.addEventListener('click', function() {
            if (!isInitialized) {
                isInitialized = initializeServices();
                if (!isInitialized) return;
                
                // ترحيب أولي
                setTimeout(function() {
                    const welcomeMessage = "أهلاً بك! أنا سعاد، المساعد الصوتي الشخصي. أنا هنا للدردشة والمساعدة. ممكن أعرف اسمك؟";
                    addSaadMessage(welcomeMessage);
                    SpeechSynthesisService.speak(welcomeMessage);
                }, 1000);
                
                return;
            }
            
            if (SpeechRecognitionService.isListening) {
                SpeechRecognitionService.stop();
                startBtn.classList.remove('listening-animation');
                statusIndicator.textContent = 'تم إيقاف الاستماع';
                statusIndicator.classList.remove('listening');
            } else {
                SpeechRecognitionService.start();
                startBtn.classList.add('listening-animation');
                statusIndicator.textContent = 'أنا أستمع...';
                statusIndicator.classList.add('listening');
            }
        });
    }
    
    // إضافة رسالة المستخدم إلى المحادثة
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // إضافة رسالة سعاد إلى المحادثة
    function addSaadMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message saad-message';
        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // معالجة مدخلات المستخدم
    async function processUserInput(text) {
        statusIndicator.textContent = 'سعاد تفكر...';
        statusIndicator.classList.add('processing');
        
        // التحقق من الاسم إذا لم يتم سؤال المستخدم بعد
        if (!userAskedName && !text.includes('اسمك') && !text.includes('اسمي')) {
            const nameMatch = text.match(/اسمي\s+([\u0600-\u06FF\s]+)/i);
            if (nameMatch && nameMatch[1]) {
                userName = nameMatch[1].trim();
                userAskedName = true;
                
                const response = `أهلاً ${userName}! اسمك جميل أوي! أنا سعيدة جداً بالتعرف عليك. عندك كام سنة؟`;
                addSaadMessage(response);
                SpeechSynthesisService.speak(response);
                statusIndicator.textContent = 'جاهزة للاستماع...';
                statusIndicator.classList.remove('processing');
                return;
            }
        }
        
        // التحقق من العمر إذا تم سؤال المستخدم عن الاسم ولكن ليس العمر بعد
        if (userAskedName && !userAskedAge && !text.includes('عمرك') && (text.includes('عمري') || text.includes('سنة') || /\d+/.test(text))) {
            userAskedAge = true;
            
            const ageJoke = SAAD_PERSONA.getAgeJoke();
            const response = `${ageJoke} أنا سعيدة جداً بالتعرف عليك يا ${userName}! ممكن أساعدك في إيه النهاردة؟`;
            
            addSaadMessage(response);
            SpeechSynthesisService.speak(response);
            statusIndicator.textContent = 'جاهزة للاستماع...';
            statusIndicator.classList.remove('processing');
            return;
        }
        
        // التحقق من السؤال عن مؤمن
        if (text.includes('مؤمن') || text.includes('المبرمج') || text.includes('صنعك') || text.includes('برمجك')) {
            const moamenReference = SAAD_PERSONA.getMoamenReference();
            addSaadMessage(moamenReference);
            SpeechSynthesisService.speak(moamenReference);
            statusIndicator.textContent = 'جاهزة للاستماع...';
            statusIndicator.classList.remove('processing');
            return;
        }
        
        // إرسال النص إلى Gemini API للحصول على استجابة
        try {
            const result = await GeminiService.generateResponse(text);
            
            if (result.success) {
                addSaadMessage(result.text);
                SpeechSynthesisService.speak(result.text);
            } else {
                console.error('خطأ في الحصول على استجابة:', result.error);
                const errorResponse = SAAD_PERSONA.getTechnicalErrorResponse();
                addSaadMessage(errorResponse);
                SpeechSynthesisService.speak(errorResponse);
            }
        } catch (error) {
            console.error('خطأ في معالجة مدخلات المستخدم:', error);
            const errorResponse = SAAD_PERSONA.getTechnicalErrorResponse();
            addSaadMessage(errorResponse);
            SpeechSynthesisService.speak(errorResponse);
        }
        
        statusIndicator.textContent = 'جاهزة للاستماع...';
        statusIndicator.classList.remove('processing');
    }
});