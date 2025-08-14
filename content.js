// Twitch WeeklyBot Message Modifier
// This script modifies WeeklyBot messages to appear as if sent by the mentioned user

(function() {
    'use strict';

    // Function to modify WeeklyBot messages
    function modifyWeeklyBotMessage(chatMessage) {
        try {
            // Find the username element
            const usernameElement = chatMessage.querySelector('[data-a-target="chat-message-username"]');
            if (!usernameElement || usernameElement.textContent.trim() !== 'WeeklyBot') {
                return;
            }

            // Find the message content
            const messageElement = chatMessage.querySelector('[data-a-target="chat-message-text"]');
            if (!messageElement) {
                return;
            }

            const messageText = messageElement.textContent.trim();
            const words = messageText.split(' ');

            // Check if there's at least one word (the target username)
            if (words.length === 0) {
                return;
            }

            const targetUsername = words[0];

            // Don't modify if the first word doesn't look like a username
            if (targetUsername.length === 0 || targetUsername.includes(' ')) {
                return;
            }

            // Modify the username display
            usernameElement.textContent = targetUsername;

            // Remove the target username from the message content
            const remainingMessage = words.slice(1).join(' ');
            messageElement.textContent = remainingMessage;

            // Update the username color to match typical user colors
            usernameElement.style.color = generateUserColor(targetUsername);

            // Add a subtle indicator that this was modified (optional)
            chatMessage.setAttribute('data-modified-by-weeklybot-extension', 'true');

        } catch (error) {
            console.log('WeeklyBot extension error:', error);
        }
    }

    // Generate a consistent color for usernames (similar to Twitch's approach)
    function generateUserColor(username) {
        const colors = [
            '#FF0000', '#0000FF', '#008000', '#B22222', '#FF7F50',
            '#9ACD32', '#FF4500', '#2E8B57', '#DAA520', '#D2691E',
            '#5F9EA0', '#1E90FF', '#FF69B4', '#8A2BE2', '#00FF7F'
        ];

        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    }

    // Observer to watch for new chat messages
    function observeChat() {
        const chatContainer = document.querySelector('[data-a-target="chat-scroller"]') ||
                            document.querySelector('.chat-scrollable-area__message-container') ||
                            document.querySelector('.simplebar-content');

        if (!chatContainer) {
            // Retry after a short delay if chat container isn't found
            setTimeout(observeChat, 1000);
            return;
        }

        // Process existing messages
        const existingMessages = chatContainer.querySelectorAll('[data-a-target="chat-message"]');
        existingMessages.forEach(modifyWeeklyBotMessage);

        // Set up mutation observer for new messages
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a chat message
                        if (node.hasAttribute && node.hasAttribute('data-a-target') &&
                            node.getAttribute('data-a-target') === 'chat-message') {
                            modifyWeeklyBotMessage(node);
                        }

                        // Also check child elements
                        const chatMessages = node.querySelectorAll('[data-a-target="chat-message"]');
                        chatMessages.forEach(modifyWeeklyBotMessage);
                    }
                });
            });
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true
        });

        console.log('WeeklyBot message modifier initialized');
    }

    // Wait for page load and then start observing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeChat);
    } else {
        observeChat();
    }

    // Also try to initialize after a delay to handle dynamic loading
    setTimeout(observeChat, 3000);
})();