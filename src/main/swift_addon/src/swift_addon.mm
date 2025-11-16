#import <Foundation/Foundation.h>
#import "SwiftBridge.h"
#include <napi.h>

class SwiftAddon : public Napi::ObjectWrap<SwiftAddon> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "SwiftAddon", {
            InstanceMethod("spawnWindow", &SwiftAddon::SpawnWindow),
            InstanceMethod("closeWindow", &SwiftAddon::CloseWindow),
            InstanceMethod("toggleVideo", &SwiftAddon::ToggleVideo)
        });

        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);

        exports.Set("SwiftAddon", func);
        return exports;
    }

    struct CallbackData {
        std::string eventType;
        std::string payload;
        SwiftAddon* addon;
    };

    SwiftAddon(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<SwiftAddon>(info)
        , env_(info.Env())
        , emitter(Napi::Persistent(Napi::Object::New(info.Env())))
        , callbacks(Napi::Persistent(Napi::Object::New(info.Env())))
        , tsfn_(nullptr) {

        napi_status status = napi_create_threadsafe_function(
            env_,
            nullptr,
            nullptr,
            Napi::String::New(env_, "SwiftCallback"),
            0,
            1,
            nullptr,
            nullptr,
            this,
            [](napi_env env, napi_value js_callback, void* context, void* data) {
                auto* callbackData = static_cast<CallbackData*>(data);
                if (!callbackData) return;

                Napi::Env napi_env(env);
                Napi::HandleScope scope(napi_env);

                auto addon = static_cast<SwiftAddon*>(context);
                if (!addon) {
                    delete callbackData;
                    return;
                }

                try {
                    auto callback = addon->callbacks.Value().Get(callbackData->eventType).As<Napi::Function>();
                    if (callback.IsFunction()) {
                        callback.Call(addon->emitter.Value(), {Napi::String::New(napi_env, callbackData->payload)});
                    }
                } catch (...) {}

                delete callbackData;
            },
            &tsfn_
        );

        if (status != napi_ok) {
            Napi::Error::New(env_, "Failed to create threadsafe function").ThrowAsJavaScriptException();
            return;
        }
    }

private:
    Napi::Env env_;
    Napi::ObjectReference emitter;
    Napi::ObjectReference callbacks;
    napi_threadsafe_function tsfn_;

    void SpawnWindow(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        std::string path = info[0].As<Napi::String>();
        double atTime = info[1].As<Napi::Number>();

        NSString *filePath = [[NSString alloc] initWithBytes:path.c_str()
                                              length:path.size()
                                            encoding:NSUTF8StringEncoding];
        [SwiftBridge spawnWindow:filePath time:atTime];
    }

    void CloseWindow(const Napi::CallbackInfo& info) {
        [SwiftBridge closeWindow];
    }

    void ToggleVideo(const Napi::CallbackInfo& info) {
        [SwiftBridge toggleVideo];
    }
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return SwiftAddon::Init(env, exports);
}

NODE_API_MODULE(swift_addon, Init)