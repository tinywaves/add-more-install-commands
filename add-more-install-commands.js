// ==UserScript==
// @name         NPM commands enhance
// @namespace    tinywaves
// @version      0.0.1
// @description  The NPM repository only show npm install command, this script will show yarn, pnpm and bun install command
// @author       tinywaves · https://github.com/tinywaves
// @match        https://www.npmjs.com/package/*
// @icon         https://static-production.npmjs.com/1996fcfdf7ca81ea795f67f093d7f449.png
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const showToast = (message) => {
    const existingToast = document.querySelector('.npm-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'npm-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '20px',
      padding: '8px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      color: '#212529',
      opacity: '0',
      transition: 'opacity 0.3s ease-in-out',
    });

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    document.body.appendChild(toast);

    setTimeout(() => (toast.style.opacity = '1'), 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  const waitForElement = (text, options) => {
    options = options || {};
    const containerSelector = options.containerSelector;
    const exact = options.exact || false;
    const timeout = options.timeout || 5000;
    const container = containerSelector ? document.querySelector(containerSelector) : document.body;

    if (!container) {
      return Promise.reject('Container not found');
    }

    const matchFn = (el) => {
      if (!el.textContent) {
        return false;
      }
      return exact ? el.textContent.trim() === text : el.textContent.includes(text);
    };

    const found = Array.from(container.querySelectorAll('*')).find(matchFn);
    if (found) {
      return Promise.resolve(found);
    }

    return new Promise((resolve, reject) => {
      const observer = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            if (!(node instanceof HTMLElement)) {
              continue;
            }
            if (matchFn(node)) {
              observer.disconnect();
              clearTimeout(timer);
              return resolve(node);
            }
            const child = node.querySelector('*');
            if (child && matchFn(child)) {
              observer.disconnect();
              clearTimeout(timer);
              return resolve(child);
            }
          }
        }
      });

      observer.observe(container, { childList: true, subtree: true });

      const timer = setTimeout(() => {
        observer.disconnect();
        reject('Element not found within timeout');
      }, timeout);
    });
  };

  const createInstallCommandElement = (nextElement, commandText, packageName) => {
    const clonedNextElement = nextElement.cloneNode(true);
    const clonedNextCodeElement = clonedNextElement.querySelector('code');
    if (clonedNextCodeElement) {
      clonedNextCodeElement.textContent = commandText;
    }

    const button = clonedNextElement.querySelector('button');
    if (button) {
      button.addEventListener('click', () => {
        navigator.clipboard
          .writeText(commandText)
          .then(() => showToast(`${packageName} install command copied!`))
          .catch(() => showToast(`${packageName} install command copy failed`));
      });
    }

    return clonedNextElement;
  };

  waitForElement('Install', { exact: true })
    .then((el) => {
      const nextElement = el.nextElementSibling;
      if (!nextElement) {
        return;
      }
      const nextCodeElement = nextElement.querySelector('code');
      if (!nextCodeElement) {
        return;
      }

      const text = nextCodeElement.textContent;
      const textSplits = text.split(' ');
      const packageName = textSplits[2];
      if (!packageName) {
        return;
      }

      [
        'yarn add <> -D',
        'yarn add <>',
        'bun add <> -D',
        'bun add <>',
        'pnpm add <> -D',
        'pnpm add <>',
      ].forEach((command) => {
        const commandText = `${command.replace('<>', packageName)}`;
        el.parentNode.insertBefore(
          createInstallCommandElement(nextElement, commandText, packageName),
          el.nextSibling
        );
      });

      nextElement.parentNode.insertBefore(
        createInstallCommandElement(nextElement, `npm i ${packageName} -D`, packageName),
        nextElement.nextSibling
      );
    })
    .catch(console.error);
})();
