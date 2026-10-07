import os
import time
import random
from instagrapi import Client

# جلب بيانات الحساب الوهمي من متغيرات البيئة للأمان
USERNAME = os.environ.get("INSTA_USERNAME")
PASSWORD = os.environ.get("INSTA_PASSWORD")

cl = Client()

def run_bot():
    # التحقق من وجود البيانات
    if not USERNAME or not PASSWORD:
        print("❌ خطأ: لم يتم العثور على INSTA_USERNAME أو INSTA_PASSWORD في متغيرات البيئة!")
        return

    try:
        print("🔄 جاري تسجيل الدخول بالحساب الوهمي...")
        cl.login(USERNAME, PASSWORD)
        print("✅ تم تسجيل الدخول بنجاح! بدأ البوت بالعمل الآن...\n")

        # قائمة الهاشتاقات المستهدفة للتفاعل
        hashtags = ["تصاميم", "صور", "افتارات", "خواطر", "رمزيات"]

        while True:
            # اختيار هاشتاق عشوائي في كل دورة
            tag = random.choice(hashtags)
            print(f"🔍 البحث عن أحدث المنشورات في هاشتاق: #{tag}")
            
            try:
                # جلب 5 منشورات حديثة
                medias = cl.hashtag_medias_recent(tag, amount=5)
                
                for media in medias:
                    try:
                        # إعجاب بالمنشور
                        cl.media_like(media.id)
                        print(f"❤️ تم وضع لايك للمنشور: {media.id}")

                        # وقت انتظار عشوائي بين 30 إلى 60 ثانية لتجنب الحظر
                        wait_time = random.randint(30, 60)
                        print(f"⏳ الانتظار لمدة {wait_time} ثانية قبل المنشور التالي...\n")
                        time.sleep(wait_time)

                    except Exception as e:
                        print(f"⚠️ تعذر التفاعل مع هذا المنشور: {e}")
                        time.sleep(15)

            except Exception as e:
                print(f"❌ خطأ أثناء جلب منشورات الهاشتاق: {e}")
                time.sleep(30)

    except Exception as e:
        print(f"🚨 خطأ رئيسي أثناء تشغيل البوت: {e}")

if __name__ == "__main__":
    run_bot()
