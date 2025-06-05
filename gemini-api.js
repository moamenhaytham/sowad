/**
 * ملف التعامل مع واجهة برمجة التطبيقات Gemini
 */

const GeminiService = {
    apiKey: 'AIzaSyDrVsq5P6ndL9cDJSSWik-HOcL6X6zyVNU', // يجب تعيين مفتاح API هنا
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    conversationHistory: [],
    maxHistoryLength: 10,
    
    init: function(apiKey) {
        this.apiKey = apiKey;
        if (this.apiKey) {
            console.log('تم تهيئة خدمة Gemini');
            return true;
        } else {
            console.error('مفتاح API مطلوب لخدمة Gemini');
            return false;
        }
    },
    
    addToHistory: function(role, text) {
        this.conversationHistory.push({
            role: role, // 'user' أو 'model'
            parts: [{ text: text }]
        });
        
        // الاحتفاظ بآخر N من المحادثات فقط
        if (this.conversationHistory.length > this.maxHistoryLength) {
            // الاحتفاظ دائمًا بأول عنصر (شخصية سعاد) وآخر N-1 من المحادثات
            const saadPersona = this.conversationHistory[0];
            this.conversationHistory = [
                saadPersona,
                ...this.conversationHistory.slice(-(this.maxHistoryLength - 1))
            ];
        }
    },
    
    resetHistory: function() {
        // الاحتفاظ فقط بشخصية سعاد في بداية المحادثة
        const saadPersona = {
            role: 'model',
            parts: [{ text: SAAD_PERSONA.getPrompt() }]
        };
        
        this.conversationHistory = [saadPersona];
    },
    
    generateResponse: async function(userInput) {
        if (!this.apiKey) {
            console.error('مفتاح API غير موجود');
            return { success: false, error: 'مفتاح API غير موجود' };
        }
        
        // إذا كانت المحادثة فارغة، قم بتهيئتها بشخصية سعاد
        if (this.conversationHistory.length === 0) {
            this.resetHistory();
        }
        
        // إضافة مدخلات المستخدم إلى المحادثة
        this.addToHistory('user', userInput);
        
        try {
            const url = `${this.apiUrl}?key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: this.conversationHistory,
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 200
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('خطأ في استجابة Gemini API:', errorData);
                return { 
                    success: false, 
                    error: 'خطأ في استجابة API', 
                    details: errorData 
                };
            }
            
            const data = await response.json();
            
            if (!data.candidates || data.candidates.length === 0) {
                console.error('لم يتم العثور على استجابة من Gemini API');
                return { 
                    success: false, 
                    error: 'لم يتم العثور على استجابة' 
                };
            }
            
            const generatedText = data.candidates[0].content.parts[0].text;
            
            // إضافة استجابة النموذج إلى المحادثة
            this.addToHistory('model', generatedText);
            
            return { 
                success: true, 
                text: generatedText 
            };
        } catch (error) {
            console.error('خطأ في طلب Gemini API:', error);
            return { 
                success: false, 
                error: 'خطأ في طلب API', 
                details: error.message 
            };
        }
    }
};