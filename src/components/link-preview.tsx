// Slightly modified version of https://github.com/delbaoliveira/website/blob/main/ui/LinkPreview.tsx

import React, { useState, useEffect } from 'react';
import { Portal, Transition } from '@headlessui/react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import Image from 'next/image';
import { encode } from 'qss';

import { weservLoader } from '@/lib/weserv-loader';

export const LinkPreview = ({
  children,
  url
}: {
  children: React.ReactNode;
  url: string;
}) => {
  const width = 200;
  const height = 125;
  const layout = 'fixed';

  // Simplifies things by encoding our microlink params into a query string.
  const params = encode({
    url: url[0] === '/' ? `https://axeldelafosse.com${url}` : url,
    screenshot: true,
    meta: false,
    embed: 'screenshot.url',
    colorScheme: 'dark',
    'viewport.isMobile': true,

    // To capture useful content, the screenshot viewport needs to be bigger
    // than our images but maintain the same ratio
    'viewport.width': width * 3,
    'viewport.height': height * 3
  });

  const src = `https://api.microlink.io/?${params}`;

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {/**
       * Microlink.io + next/image can take a few seconds to fetch and generate
       * a screenshot. The delay makes <LinkPreview> pointless. As a hacky
       * solution we create a second <Image> in a Portal after the component has
       * mounted. This <Image> triggers microlink.io + next/image so that the
       * image itself is ready by the time the user hovers on a <LinkPreview>.
       * Not concerned about the performance impact because <Image>'s are cached
       * after they are generated and the images themselves are tiny (< 10kb).
       */}
      {isMounted ? (
        <Portal>
          <div className="hidden">
            <Image
              src={src}
              width={width}
              height={height}
              layout={layout}
              priority={true}
              loader={weservLoader}
            />
          </div>
        </Portal>
      ) : null}

      <HoverCardPrimitive.Root
        openDelay={50}
        onOpenChange={(open) => {
          setIsOpen(open);
        }}
      >
        <HoverCardPrimitive.Trigger href={url}>
          {children}
        </HoverCardPrimitive.Trigger>

        <HoverCardPrimitive.Content side="top" align="center" sideOffset={10}>
          <Transition
            show={isOpen}
            appear={true}
            enter="transform transition duration-300 origin-bottom ease-out"
            enterFrom="opacity-0 translate-y-2 scale-0"
            enterTo="opacity-100 translate-y-0 scale-100"
            className="shadow-xl rounded-xl"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-1 bg-white border border-transparent shadow rounded-xl hover:border-purple-500"
              style={{ fontSize: 0 }}
            >
              <Image
                src={src}
                width={width}
                height={height}
                layout={layout}
                className="rounded-lg"
                loader={weservLoader}
              />
            </a>
          </Transition>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Root>
    </>
  );
};
