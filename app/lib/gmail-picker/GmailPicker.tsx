import { h } from "preact";
import slugify from "slugify";
import TurndownService from "turndown";
import { MinimalRequiredUppyFile, UIPlugin, Uppy } from "@uppy/core";
import {
  RequestClient,
  type CompanionPluginOptions,
  tokenStorage,
} from "@uppy/companion-client";
import type { Body, Meta } from "@uppy/utils/lib/UppyFile";
import type { AsyncStore, BaseProviderPlugin } from "@uppy/core/lib/Uppy.js";
import GmailPickerView from "../gmail-provider-views/GmailPickerView";
import GmailIcon from "../gmail-provider-views/icon";
import type { Message, MessagePart } from "../gmail-provider-views/gmailPicker";

// @ts-ignore We don't want TS to generate types for the package.json

export type GmailPickerOptions = CompanionPluginOptions & {
  clientId: string;
  apiKey: string;
  appId: string;
};

export default class GmailPicker<M extends Meta, B extends Body>
  extends UIPlugin<GmailPickerOptions, M, B>
  implements BaseProviderPlugin
{
  static VERSION = "1.0.0";

  static requestClientId = GmailPicker.name;

  type = "acquirer";

  icon = GmailIcon;

  storage: AsyncStore;

  turndown: TurndownService;

  defaultLocale = {
    strings: {
      pluginNameGmailPicker: "Gmail Picker",
    },
  };

  constructor(uppy: Uppy<M, B>, opts: GmailPickerOptions) {
    super(uppy, opts);
    this.id = this.opts.id || "GmailPicker";
    this.storage = this.opts.storage || tokenStorage;

    this.i18nInit();
    this.title = this.i18n("pluginNameGmailPicker");
    this.turndown = new TurndownService();

    const client = new RequestClient(uppy, {
      pluginId: this.id,
      provider: "url",
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionCookiesRule: this.opts.companionCookiesRule,
    });

    this.uppy.registerRequestClient(GmailPicker.requestClientId, client);
  }

  install(): void {
    const { target } = this.opts;
    if (target) {
      this.mount(target, this);
    }
  }

  uninstall(): void {
    this.unmount();
  }

  private decode = function (input: string) {
    // Replace non-url compatible chars with base64 standard chars
    input = input.replace(/-/g, "+").replace(/_/g, "/");

    // Pad out with standard base64 required padding characters
    var pad = input.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error(
          "InvalidLengthError: Input base64url string is the wrong length to determine padding"
        );
      }
      input += new Array(5 - pad).join("=");
    }

    return input;
  };

  private handleEmailPicked = async (emails: Message[]) => {
    const extractContent = (part: MessagePart, emailContent: string) => {
      if (part.body?.data) {
        emailContent += this.turndown.turndown(
          atob(this.decode(part.body.data))
        );
      }
      if (part.parts) {
        for (const subPart of part.parts) {
          emailContent += extractContent(subPart, emailContent);
        }
      }
      return emailContent;
    };

    let files: MinimalRequiredUppyFile<Meta, Body>[] = [];
    for (const email of emails) {
      const emailContent = extractContent(email.payload, "");

      const filename = slugify(
        email.payload.headers.find((h) => h.name === "Subject")?.value ??
          "Untitled-" + Date.now(),
        {
          replacement: "-",
          lower: true,
          strict: true,
          trim: true,
        }
      );

      files.push({
        source: this.id,
        name: `${filename}.md`,
        type: "text/markdown",
        data: new Blob([emailContent], {
          type: "text/markdown",
        }),
      });
    }
    try {
      this.uppy.addFiles(files);
    } catch (e) {
      console.error(e);
    }
  };

  render = () => {
    return h(GmailPickerView, {
      storage: this.storage,
      uppy: this.uppy,
      clientId: this.opts.clientId,
      onEmailPicked: this.handleEmailPicked,
    });
  };
}
