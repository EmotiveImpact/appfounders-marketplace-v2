"use client";

import * as React from "react";

function Component() {
  return (
    <div className="flex items-center rounded-full border border-border bg-background p-1 shadow shadow-black/5">
      <div className="flex -space-x-1.5">
        <div
          className="w-5 h-5 rounded-full ring-1 ring-background bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium"
          title="Avatar 01"
        >
          A
        </div>
        <div
          className="w-5 h-5 rounded-full ring-1 ring-background bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-medium"
          title="Avatar 02"
        >
          B
        </div>
        <div
          className="w-5 h-5 rounded-full ring-1 ring-background bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium"
          title="Avatar 03"
        >
          C
        </div>
        <div
          className="w-5 h-5 rounded-full ring-1 ring-background bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium"
          title="Avatar 04"
        >
          D
        </div>
      </div>
      <p className="px-2 text-xs text-muted-foreground">
        Trusted by <strong className="font-medium text-foreground">60K+</strong> developers.
      </p>
    </div>
  );
}

export { Component as AvatarGroup };
