#import "SwiftBridge.h"
#import "swift_addon-Swift.h"
#import <Foundation/Foundation.h>

@implementation SwiftBridge

+ (void)spawnWindow: (NSString *)filePath time:(double)atTime {
    [SwiftCode spawnWindow:filePath time:atTime];
}

+ (void)closeWindow {
    [SwiftCode closeWindow];
}

+ (void)toggleVideo {
    [SwiftCode toggleVideo];
}

@end