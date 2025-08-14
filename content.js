// Twitch WeeklyBot Message Modifier
// This script modifies WeeklyBot messages to appear as if sent by the mentioned user

(function() {
    'use strict';

    // Configuration - set to false to disable logging
    const DEBUG_LOGGING = true;

    function log(...args) {
        if (DEBUG_LOGGING) {
            console.log('WeeklyBot extension:', ...args);
        }
    }

    function logError(...args) {
        if (DEBUG_LOGGING) {
            console.error('WeeklyBot extension:', ...args);
        }
    }

    // Function to modify WeeklyBot messages
    function modifyWeeklyBotMessage(chatMessage) {
        try {
            // Multiple selectors for username element
            const usernameElement = chatMessage.querySelector('[data-a-target="chat-message-username"]') ||
                                  chatMessage.querySelector('.chat-author__display-name') ||
                                  chatMessage.querySelector('.chat-line__username') ||
                                  chatMessage.querySelector('[data-test-selector="message-username"]');

            if (!usernameElement) {
                log('No username element found in message');
                return;
            }

            const username = usernameElement.textContent.trim();
            if (username !== 'Weekly_Bot') {
                // Only log if it's a different bot to avoid spam
                if (DEBUG_LOGGING && username.toLowerCase().includes('bot')) {
                    log('Found bot message but not Weekly_Bot:', username);
                }
                return;
            }

            log('Found Weekly_Bot message!');

            // Multiple selectors for message content
            const messageElement = chatMessage.querySelector('[data-a-target="chat-message-text"]') ||
                                 chatMessage.querySelector('.text-fragment') ||
                                 chatMessage.querySelector('.chat-line__message') ||
                                 chatMessage.querySelector('[data-test-selector="chat-line-message-body"]');

            if (!messageElement) {
                log('No message content element found');
                return;
            }

            const messageText = messageElement.textContent.trim();
            log('Message text:', messageText);

            const words = messageText.split(' ');

            // Check if there's at least one word (the target username)
            if (words.length === 0) {
                log('Message has no words');
                return;
            }

            const firstWord = words[0];
            log('First word:', firstWord);

            // Check if the first word is contained within 【 and 】
            if (!firstWord.startsWith('【') || !firstWord.endsWith('】')) {
                log('First word is not wrapped in 【】, leaving message unchanged');
                return;
            }

            // Extract the username from within the brackets
            const targetUsername = firstWord.slice(1, -1); // Remove first and last character (the brackets)
            log('Target username from brackets:', targetUsername);

            // Don't modify if the extracted username is empty
            if (targetUsername.length === 0) {
                log('Username within brackets is empty');
                return;
            }

            // Modify the username display
            usernameElement.textContent = targetUsername;
            log('Changed username to:', targetUsername);

            // Remove the target username from the message content
            const remainingMessage = words.slice(1).join(' ');
            messageElement.textContent = remainingMessage;
            log('Updated message content to:', remainingMessage);

            // Remove moderator badges and add custom W icon
            modifyUserBadges(chatMessage, targetUsername);

            // Add a subtle indicator that this was modified (optional)
            chatMessage.setAttribute('data-modified-by-weeklybot-extension', 'true');
            log('Successfully modified message!');

        } catch (error) {
            logError('Error:', error);
        }
    }

    // Remove moderator badges and add custom W icon
    function modifyUserBadges(chatMessage, targetUsername) {
        try {
            // First, save the username text in case it gets removed
            const usernameElement = chatMessage.querySelector('[data-a-target="chat-message-username"]') ||
                                  chatMessage.querySelector('.chat-author__display-name') ||
                                  chatMessage.querySelector('.chat-line__username');

            const originalUsernameText = usernameElement ? usernameElement.textContent : targetUsername;
            log('Saved username text:', originalUsernameText);

            // Find the badges container - try multiple approaches
            let badgeContainer = null;

            // Approach 1: Look for existing badge containers
            const badgeSelectors = [
                '.chat-line__message--badges',
                '[data-a-target="chat-badges"]',
                '.chat-author__badges',
                '.chat-line__username-container .tw-inline-flex',
                '.chat-line__username-container',
                '.chat-author__intl-login'
            ];

            for (const selector of badgeSelectors) {
                badgeContainer = chatMessage.querySelector(selector);
                if (badgeContainer) {
                    log('Found badge container with selector:', selector);
                    break;
                }
            }

            // Approach 2: Look for individual badges and find their container
            if (!badgeContainer) {
                const individualBadges = chatMessage.querySelectorAll('.chat-badge, [data-a-target*="badge"], img[alt*="Moderator"], img[alt*="Subscriber"]');
                if (individualBadges.length > 0) {
                    badgeContainer = individualBadges[0].parentElement;
                    log('Found badge container via individual badges');
                }
            }

            // Approach 3: Find username element and look for siblings or nearby elements
            if (!badgeContainer) {
                if (usernameElement) {
                    // Look for a sibling or parent that might contain badges
                    badgeContainer = usernameElement.previousElementSibling ||
                                   usernameElement.parentElement.querySelector('[class*="badge"]')?.parentElement ||
                                   usernameElement.parentElement;
                    log('Using username element area for badges');
                }
            }

            if (!badgeContainer) {
                log('No badge container found, creating one');

                // Create a badge container if none exists
                if (usernameElement) {
                    badgeContainer = document.createElement('span');
                    badgeContainer.className = 'weeklybot-badges-container';
                    badgeContainer.style.cssText = 'display: inline-flex; align-items: center; margin-right: 4px;';

                    // Insert before the username
                    usernameElement.parentNode.insertBefore(badgeContainer, usernameElement);
                    log('Created new badge container');
                } else {
                    log('Could not find username element to attach badges');
                    return;
                }
            }

            // Remove all existing badges from the container and nearby areas, but preserve username
            const existingBadges = chatMessage.querySelectorAll('.chat-badge, [data-a-target*="badge"], img[alt*="Moderator"], img[alt*="Subscriber"], .tw-tooltip-wrapper');
            existingBadges.forEach(badge => {
                // Don't remove the username element or elements containing the username
                if (badge !== usernameElement && !badge.contains(usernameElement)) {
                    log('Removing existing badge:', badge.className || badge.alt || badge.tagName);
                    badge.remove();
                }
            });

            // Clear the badge container but only if it's not the username container
            if (badgeContainer !== usernameElement && badgeContainer !== usernameElement?.parentElement) {
                badgeContainer.innerHTML = '';
                log('Cleared badge container');
            }

            // Create custom W badge
            const wBadge = document.createElement('span');
            wBadge.className = 'chat-badge weeklybot-w-badge';
            wBadge.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                background: linear-gradient(135deg, #9147FF, #6441A4);
                color: white;
                font-weight: bold;
                font-size: 12px;
                border-radius: 2px;
                margin-right: 4px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                vertical-align: middle;
                flex-shrink: 0;
            `;
            wBadge.textContent = 'W';
            wBadge.title = 'Weekly Bot Message';

            // Add the W badge to the container
            badgeContainer.appendChild(wBadge);
            log('Added custom W badge');

            // Ensure the username is restored after badge modifications
            const currentUsernameElement = chatMessage.querySelector('[data-a-target="chat-message-username"]') ||
                                         chatMessage.querySelector('.chat-author__display-name') ||
                                         chatMessage.querySelector('.chat-line__username');

            if (currentUsernameElement) {
                // Make sure the username text is correct
                if (currentUsernameElement.textContent !== targetUsername) {
                    currentUsernameElement.textContent = targetUsername;
                    log('Restored username text to:', targetUsername);
                }
            } else {
                // If username element was accidentally removed, recreate it
                log('Username element missing, recreating...');
                const newUsernameElement = document.createElement('span');
                newUsernameElement.setAttribute('data-a-target', 'chat-message-username');
                newUsernameElement.className = 'chat-author__display-name';
                newUsernameElement.style.cssText = 'font-weight: bold; margin-right: 4px;';
                newUsernameElement.textContent = targetUsername;

                // Insert after the badge container
                if (badgeContainer.nextSibling) {
                    badgeContainer.parentNode.insertBefore(newUsernameElement, badgeContainer.nextSibling);
                } else {
                    badgeContainer.parentNode.appendChild(newUsernameElement);
                }
                log('Recreated username element');
            }

        } catch (error) {
            logError('Error modifying badges:', error);
        }
    }

    // Observer to watch for new chat messages
    function observeChat() {
        // More comprehensive list of possible chat container selectors
        const possibleSelectors = [
            '[data-a-target="chat-scroller"]',
            '.chat-scrollable-area__message-container',
            '.simplebar-content',
            '[data-test-selector="chat-scrollable-area__message-container"]',
            '.chat-list',
            '.chat-list__lines',
            '.chat-room__content .simplebar-content',
            '.chat-input',
            '[role="log"]'
        ];

        let chatContainer = null;
        for (const selector of possibleSelectors) {
            chatContainer = document.querySelector(selector);
            if (chatContainer) {
                console.log('Found chat container with selector:', selector);
                break;
            }
        }

        // If still not found, try looking for any element that contains chat messages
        if (!chatContainer) {
            const messageElements = document.querySelectorAll('[data-a-target="chat-message"]');
            if (messageElements.length > 0) {
                chatContainer = messageElements[0].closest('.simplebar-content') ||
                              messageElements[0].parentElement;
                console.log('Found chat container by finding existing messages');
            }
        }

        if (!chatContainer) {
            log('Chat container not found with any selector, retrying...');
            if (DEBUG_LOGGING) {
                log('Available elements:', {
                    'chat-messages': document.querySelectorAll('[data-a-target="chat-message"]').length,
                    'simplebar-content': document.querySelectorAll('.simplebar-content').length,
                    'role-log': document.querySelectorAll('[role="log"]').length
                });
            }
            // Retry after a short delay if chat container isn't found
            setTimeout(observeChat, 2000);
            return;
        }

        log('Chat container found:', chatContainer);

        // Process existing messages with multiple selectors
        const messageSelectors = [
            '[data-a-target="chat-message"]',
            '.chat-line__message',
            '[data-test-selector="chat-line"]'
        ];

        messageSelectors.forEach(selector => {
            const existingMessages = chatContainer.querySelectorAll(selector);
            log(`Found ${existingMessages.length} existing messages with selector "${selector}"`);
            existingMessages.forEach(modifyWeeklyBotMessage);
        });

        // Set up mutation observer for new messages
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Multiple possible selectors for chat messages
                        const messageSelectors = [
                            '[data-a-target="chat-message"]',
                            '.chat-line__message',
                            '[data-test-selector="chat-line"]'
                        ];

                        // Check if the added node is a chat message
                        for (const selector of messageSelectors) {
                            if (node.matches && node.matches(selector)) {
                                log('New message detected with selector:', selector);
                                modifyWeeklyBotMessage(node);
                                break;
                            }
                        }

                        // Also check child elements
                        for (const selector of messageSelectors) {
                            const chatMessages = node.querySelectorAll(selector);
                            chatMessages.forEach(modifyWeeklyBotMessage);
                        }
                    }
                });
            });
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true
        });

        log('MutationObserver initialized for chat monitoring');
        log('Extension fully loaded and watching for Weekly_Bot messages');
    }

    // Wait for page load and then start observing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeChat);
    } else {
        observeChat();
    }

    // Also try to initialize after delays to handle dynamic loading
    setTimeout(observeChat, 3000);
    setTimeout(observeChat, 8000);

    // Watch for navigation changes on Twitch (they use single page app routing)
    let currentUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            console.log('URL changed, reinitializing chat observer');
            setTimeout(observeChat, 2000);
        }
    }).observe(document, {subtree: true, childList: true});
})();