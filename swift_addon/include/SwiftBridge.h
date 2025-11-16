#ifndef SwiftBridge_h
#define SwiftBridge_h

#import <Foundation/Foundation.h>

@interface SwiftBridge : NSObject
+ (void)spawnWindow: (NSString *)filePath time:(double)atTime;

+ (void)closeWindow;

+ (void)toggleVideo;                       

@end

#endif