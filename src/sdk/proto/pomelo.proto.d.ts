import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace im. */
export namespace im {

    /** Namespace ack. */
    namespace ack {

        /**
         * Properties of an AckReq.
         * @deprecated Use im.ack.AckReq.$Properties instead.
         */
        interface IAckReq extends im.ack.AckReq.$Properties {
        }

        /** Represents an AckReq. */
        class AckReq {

            /**
             * Constructs a new AckReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.ack.AckReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** AckReq messageIds. */
            messageIds: (number|Long)[];

            /** AckReq ackType. */
            ackType: im.common.AckType;

            /**
             * Creates a new AckReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AckReq instance
             */
            static create(properties: im.ack.AckReq.$Shape): im.ack.AckReq & im.ack.AckReq.$Shape;
            static create(properties?: im.ack.AckReq.$Properties): im.ack.AckReq;

            /**
             * Encodes the specified AckReq message. Does not implicitly {@link im.ack.AckReq.verify|verify} messages.
             * @param message AckReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.ack.AckReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AckReq message, length delimited. Does not implicitly {@link im.ack.AckReq.verify|verify} messages.
             * @param message AckReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.ack.AckReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AckReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.ack.AckReq & im.ack.AckReq.$Shape} AckReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.ack.AckReq & im.ack.AckReq.$Shape;

            /**
             * Decodes an AckReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.ack.AckReq & im.ack.AckReq.$Shape} AckReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.ack.AckReq & im.ack.AckReq.$Shape;

            /**
             * Verifies an AckReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AckReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AckReq
             */
            static fromObject(object: { [k: string]: any }): im.ack.AckReq;

            /**
             * Creates a plain object from an AckReq message. Also converts values to other types if specified.
             * @param message AckReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.ack.AckReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AckReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AckReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AckReq {

            /** Properties of an AckReq. */
            interface $Properties {

                /** AckReq messageIds */
                messageIds?: ((number|Long)[]|null);

                /** AckReq ackType */
                ackType?: (im.common.AckType|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AckReq. */
            type $Shape = im.ack.AckReq.$Properties;
        }

        /**
         * Properties of an AckResp.
         * @deprecated Use im.ack.AckResp.$Properties instead.
         */
        interface IAckResp extends im.ack.AckResp.$Properties {
        }

        /** Represents an AckResp. */
        class AckResp {

            /**
             * Constructs a new AckResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.ack.AckResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** AckResp ackType. */
            ackType: im.common.AckType;

            /**
             * Creates a new AckResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AckResp instance
             */
            static create(properties: im.ack.AckResp.$Shape): im.ack.AckResp & im.ack.AckResp.$Shape;
            static create(properties?: im.ack.AckResp.$Properties): im.ack.AckResp;

            /**
             * Encodes the specified AckResp message. Does not implicitly {@link im.ack.AckResp.verify|verify} messages.
             * @param message AckResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.ack.AckResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AckResp message, length delimited. Does not implicitly {@link im.ack.AckResp.verify|verify} messages.
             * @param message AckResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.ack.AckResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AckResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.ack.AckResp & im.ack.AckResp.$Shape} AckResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.ack.AckResp & im.ack.AckResp.$Shape;

            /**
             * Decodes an AckResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.ack.AckResp & im.ack.AckResp.$Shape} AckResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.ack.AckResp & im.ack.AckResp.$Shape;

            /**
             * Verifies an AckResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AckResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AckResp
             */
            static fromObject(object: { [k: string]: any }): im.ack.AckResp;

            /**
             * Creates a plain object from an AckResp message. Also converts values to other types if specified.
             * @param message AckResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.ack.AckResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AckResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AckResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AckResp {

            /** Properties of an AckResp. */
            interface $Properties {

                /** AckResp ackType */
                ackType?: (im.common.AckType|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AckResp. */
            type $Shape = im.ack.AckResp.$Properties;
        }

        /**
         * Properties of an AckNotify.
         * @deprecated Use im.ack.AckNotify.$Properties instead.
         */
        interface IAckNotify extends im.ack.AckNotify.$Properties {
        }

        /** Represents an AckNotify. */
        class AckNotify {

            /**
             * Constructs a new AckNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.ack.AckNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** AckNotify messageIds. */
            messageIds: (number|Long)[];

            /** AckNotify ackType. */
            ackType: im.common.AckType;

            /**
             * Creates a new AckNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AckNotify instance
             */
            static create(properties: im.ack.AckNotify.$Shape): im.ack.AckNotify & im.ack.AckNotify.$Shape;
            static create(properties?: im.ack.AckNotify.$Properties): im.ack.AckNotify;

            /**
             * Encodes the specified AckNotify message. Does not implicitly {@link im.ack.AckNotify.verify|verify} messages.
             * @param message AckNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.ack.AckNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AckNotify message, length delimited. Does not implicitly {@link im.ack.AckNotify.verify|verify} messages.
             * @param message AckNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.ack.AckNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AckNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.ack.AckNotify & im.ack.AckNotify.$Shape} AckNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.ack.AckNotify & im.ack.AckNotify.$Shape;

            /**
             * Decodes an AckNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.ack.AckNotify & im.ack.AckNotify.$Shape} AckNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.ack.AckNotify & im.ack.AckNotify.$Shape;

            /**
             * Verifies an AckNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AckNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AckNotify
             */
            static fromObject(object: { [k: string]: any }): im.ack.AckNotify;

            /**
             * Creates a plain object from an AckNotify message. Also converts values to other types if specified.
             * @param message AckNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.ack.AckNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AckNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AckNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AckNotify {

            /** Properties of an AckNotify. */
            interface $Properties {

                /** AckNotify messageIds */
                messageIds?: ((number|Long)[]|null);

                /** AckNotify ackType */
                ackType?: (im.common.AckType|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AckNotify. */
            type $Shape = im.ack.AckNotify.$Properties;
        }
    }

    /** Namespace common. */
    namespace common {

        /** Cmd enum. */
        enum Cmd {

            /** CMD_UNKNOWN value */
            CMD_UNKNOWN = 0,

            /** CMD_AUTH_REQ value */
            CMD_AUTH_REQ = 1,

            /** CMD_AUTH_RESP value */
            CMD_AUTH_RESP = 2,

            /** CMD_LOGOUT_REQ value */
            CMD_LOGOUT_REQ = 3,

            /** CMD_LOGOUT_RESP value */
            CMD_LOGOUT_RESP = 4,

            /** CMD_C2C_REQ value */
            CMD_C2C_REQ = 16,

            /** CMD_C2C_RESP value */
            CMD_C2C_RESP = 17,

            /** CMD_C2C_NOTIFY value */
            CMD_C2C_NOTIFY = 18,

            /** CMD_C2G_REQ value */
            CMD_C2G_REQ = 32,

            /** CMD_C2G_RESP value */
            CMD_C2G_RESP = 33,

            /** CMD_C2G_NOTIFY value */
            CMD_C2G_NOTIFY = 34,

            /** CMD_PULL_REQ value */
            CMD_PULL_REQ = 48,

            /** CMD_PULL_RESP value */
            CMD_PULL_RESP = 49,

            /** CMD_CTRL_REQ value */
            CMD_CTRL_REQ = 64,

            /** CMD_CTRL_RESP value */
            CMD_CTRL_RESP = 65,

            /** CMD_CTRL_NOTIFY value */
            CMD_CTRL_NOTIFY = 66,

            /** CMD_PING value */
            CMD_PING = 80,

            /** CMD_PONG value */
            CMD_PONG = 81,

            /** CMD_ACK_REQ value */
            CMD_ACK_REQ = 82,

            /** CMD_ACK_RESP value */
            CMD_ACK_RESP = 83,

            /** CMD_ACK_NOTIFY value */
            CMD_ACK_NOTIFY = 84,

            /** CMD_FRIEND_SEARCH_REQ value */
            CMD_FRIEND_SEARCH_REQ = 96,

            /** CMD_FRIEND_SEARCH_RESP value */
            CMD_FRIEND_SEARCH_RESP = 97,

            /** CMD_FRIEND_ADD_REQ value */
            CMD_FRIEND_ADD_REQ = 98,

            /** CMD_FRIEND_ADD_RESP value */
            CMD_FRIEND_ADD_RESP = 99,

            /** CMD_FRIEND_ADD_NOTIFY value */
            CMD_FRIEND_ADD_NOTIFY = 100,

            /** CMD_FRIEND_ACCEPT_REQ value */
            CMD_FRIEND_ACCEPT_REQ = 101,

            /** CMD_FRIEND_ACCEPT_RESP value */
            CMD_FRIEND_ACCEPT_RESP = 102,

            /** CMD_FRIEND_ACCEPT_NOTIFY value */
            CMD_FRIEND_ACCEPT_NOTIFY = 103,

            /** CMD_FRIEND_DELETE_REQ value */
            CMD_FRIEND_DELETE_REQ = 104,

            /** CMD_FRIEND_DELETE_RESP value */
            CMD_FRIEND_DELETE_RESP = 105,

            /** CMD_FRIEND_DELETE_NOTIFY value */
            CMD_FRIEND_DELETE_NOTIFY = 106,

            /** CMD_GROUP_CREATE_REQ value */
            CMD_GROUP_CREATE_REQ = 112,

            /** CMD_GROUP_CREATE_RESP value */
            CMD_GROUP_CREATE_RESP = 113,

            /** CMD_GROUP_INVITE_REQ value */
            CMD_GROUP_INVITE_REQ = 114,

            /** CMD_GROUP_INVITE_RESP value */
            CMD_GROUP_INVITE_RESP = 115,

            /** CMD_GROUP_KICK_REQ value */
            CMD_GROUP_KICK_REQ = 116,

            /** CMD_GROUP_KICK_RESP value */
            CMD_GROUP_KICK_RESP = 117,

            /** CMD_GROUP_GET_INFO_REQ value */
            CMD_GROUP_GET_INFO_REQ = 134,

            /** CMD_GROUP_GET_INFO_RESP value */
            CMD_GROUP_GET_INFO_RESP = 135,

            /** CMD_GROUP_GET_MEMBERS_REQ value */
            CMD_GROUP_GET_MEMBERS_REQ = 136,

            /** CMD_GROUP_GET_MEMBERS_RESP value */
            CMD_GROUP_GET_MEMBERS_RESP = 137,

            /** CMD_GROUP_GET_MY_GROUPS_REQ value */
            CMD_GROUP_GET_MY_GROUPS_REQ = 144,

            /** CMD_GROUP_GET_MY_GROUPS_RESP value */
            CMD_GROUP_GET_MY_GROUPS_RESP = 145,

            /** CMD_GROUP_MEMBER_CHANGE_NOTIFY value */
            CMD_GROUP_MEMBER_CHANGE_NOTIFY = 147,

            /** CMD_GROUP_PULL_MSG_REQ value */
            CMD_GROUP_PULL_MSG_REQ = 148,

            /** CMD_GROUP_PULL_MSG_RESP value */
            CMD_GROUP_PULL_MSG_RESP = 149,

            /** CMD_GROUP_ACK_REQ value */
            CMD_GROUP_ACK_REQ = 150,

            /** CMD_GROUP_ACK_RESP value */
            CMD_GROUP_ACK_RESP = 151,

            /** CMD_GROUP_MSG_READ_REQ value */
            CMD_GROUP_MSG_READ_REQ = 152,

            /** CMD_GROUP_MSG_READ_RESP value */
            CMD_GROUP_MSG_READ_RESP = 153,

            /** CMD_GROUP_READ_STATE_REQ value */
            CMD_GROUP_READ_STATE_REQ = 154,

            /** CMD_GROUP_READ_STATE_RESP value */
            CMD_GROUP_READ_STATE_RESP = 155,

            /** CMD_UPLOAD_REQ value */
            CMD_UPLOAD_REQ = 160,

            /** CMD_UPLOAD_RESP value */
            CMD_UPLOAD_RESP = 161,

            /** CMD_CALL_INVITE_REQ value */
            CMD_CALL_INVITE_REQ = 176,

            /** CMD_CALL_INVITE_RESP value */
            CMD_CALL_INVITE_RESP = 177,

            /** CMD_CALL_ACCEPT_REQ value */
            CMD_CALL_ACCEPT_REQ = 178,

            /** CMD_CALL_ACCEPT_RESP value */
            CMD_CALL_ACCEPT_RESP = 179,

            /** CMD_CALL_END_REQ value */
            CMD_CALL_END_REQ = 180,

            /** CMD_CALL_END_RESP value */
            CMD_CALL_END_RESP = 181,

            /** CMD_CALL_EVENT_PUSH value */
            CMD_CALL_EVENT_PUSH = 182,

            /** CMD_CALL_TOKEN_REQ value */
            CMD_CALL_TOKEN_REQ = 183,

            /** CMD_CALL_TOKEN_RESP value */
            CMD_CALL_TOKEN_RESP = 184,

            /** CMD_ERROR value */
            CMD_ERROR = 65535
        }

        /** MsgType enum. */
        enum MsgType {

            /** MSG_TYPE_UNKNOWN value */
            MSG_TYPE_UNKNOWN = 0,

            /** MSG_TYPE_TEXT value */
            MSG_TYPE_TEXT = 1,

            /** MSG_TYPE_IMAGE value */
            MSG_TYPE_IMAGE = 2,

            /** MSG_TYPE_VOICE value */
            MSG_TYPE_VOICE = 3,

            /** MSG_TYPE_VIDEO value */
            MSG_TYPE_VIDEO = 4,

            /** MSG_TYPE_FILE value */
            MSG_TYPE_FILE = 5,

            /** MSG_TYPE_EMOJI value */
            MSG_TYPE_EMOJI = 6,

            /** MSG_TYPE_FORWARD value */
            MSG_TYPE_FORWARD = 8,

            /** MSG_TYPE_REPLY value */
            MSG_TYPE_REPLY = 9,

            /** MSG_TYPE_SYSTEM value */
            MSG_TYPE_SYSTEM = 99
        }

        /** AckType enum. */
        enum AckType {

            /** RECEIVED value */
            RECEIVED = 0,

            /** SEEN value */
            SEEN = 1
        }

        /**
         * Properties of a MessageContent.
         * @deprecated Use im.common.MessageContent.$Properties instead.
         */
        interface IMessageContent extends im.common.MessageContent.$Properties {
        }

        /** Represents a MessageContent. */
        class MessageContent {

            /**
             * Constructs a new MessageContent.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.common.MessageContent.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** MessageContent msgType. */
            msgType: im.common.MsgType;

            /** MessageContent content. */
            content: Uint8Array;

            /** MessageContent timestamp. */
            timestamp: (number|Long);

            /** MessageContent ext. */
            ext: { [k: string]: string };

            /**
             * Creates a new MessageContent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MessageContent instance
             */
            static create(properties: im.common.MessageContent.$Shape): im.common.MessageContent & im.common.MessageContent.$Shape;
            static create(properties?: im.common.MessageContent.$Properties): im.common.MessageContent;

            /**
             * Encodes the specified MessageContent message. Does not implicitly {@link im.common.MessageContent.verify|verify} messages.
             * @param message MessageContent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.common.MessageContent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MessageContent message, length delimited. Does not implicitly {@link im.common.MessageContent.verify|verify} messages.
             * @param message MessageContent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.common.MessageContent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MessageContent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.common.MessageContent & im.common.MessageContent.$Shape} MessageContent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.common.MessageContent & im.common.MessageContent.$Shape;

            /**
             * Decodes a MessageContent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.common.MessageContent & im.common.MessageContent.$Shape} MessageContent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.common.MessageContent & im.common.MessageContent.$Shape;

            /**
             * Verifies a MessageContent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MessageContent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MessageContent
             */
            static fromObject(object: { [k: string]: any }): im.common.MessageContent;

            /**
             * Creates a plain object from a MessageContent message. Also converts values to other types if specified.
             * @param message MessageContent
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.common.MessageContent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MessageContent to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for MessageContent
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace MessageContent {

            /** Properties of a MessageContent. */
            interface $Properties {

                /** MessageContent msgType */
                msgType?: (im.common.MsgType|null);

                /** MessageContent content */
                content?: (Uint8Array|null);

                /** MessageContent timestamp */
                timestamp?: (number|Long|null);

                /** MessageContent ext */
                ext?: ({ [k: string]: string }|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a MessageContent. */
            type $Shape = im.common.MessageContent.$Properties;
        }

        /**
         * Properties of an ErrorBody.
         * @deprecated Use im.common.ErrorBody.$Properties instead.
         */
        interface IErrorBody extends im.common.ErrorBody.$Properties {
        }

        /** Represents an ErrorBody. */
        class ErrorBody {

            /**
             * Constructs a new ErrorBody.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.common.ErrorBody.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** ErrorBody code. */
            code: number;

            /** ErrorBody message. */
            message: string;

            /**
             * Creates a new ErrorBody instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ErrorBody instance
             */
            static create(properties: im.common.ErrorBody.$Shape): im.common.ErrorBody & im.common.ErrorBody.$Shape;
            static create(properties?: im.common.ErrorBody.$Properties): im.common.ErrorBody;

            /**
             * Encodes the specified ErrorBody message. Does not implicitly {@link im.common.ErrorBody.verify|verify} messages.
             * @param message ErrorBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.common.ErrorBody.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ErrorBody message, length delimited. Does not implicitly {@link im.common.ErrorBody.verify|verify} messages.
             * @param message ErrorBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.common.ErrorBody.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ErrorBody message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.common.ErrorBody & im.common.ErrorBody.$Shape} ErrorBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.common.ErrorBody & im.common.ErrorBody.$Shape;

            /**
             * Decodes an ErrorBody message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.common.ErrorBody & im.common.ErrorBody.$Shape} ErrorBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.common.ErrorBody & im.common.ErrorBody.$Shape;

            /**
             * Verifies an ErrorBody message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ErrorBody message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ErrorBody
             */
            static fromObject(object: { [k: string]: any }): im.common.ErrorBody;

            /**
             * Creates a plain object from an ErrorBody message. Also converts values to other types if specified.
             * @param message ErrorBody
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.common.ErrorBody, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ErrorBody to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for ErrorBody
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace ErrorBody {

            /** Properties of an ErrorBody. */
            interface $Properties {

                /** ErrorBody code */
                code?: (number|null);

                /** ErrorBody message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an ErrorBody. */
            type $Shape = im.common.ErrorBody.$Properties;
        }
    }

    /** Namespace auth. */
    namespace auth {

        /**
         * Properties of an AuthReq.
         * @deprecated Use im.auth.AuthReq.$Properties instead.
         */
        interface IAuthReq extends im.auth.AuthReq.$Properties {
        }

        /** Represents an AuthReq. */
        class AuthReq {

            /**
             * Constructs a new AuthReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.auth.AuthReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** AuthReq token. */
            token: string;

            /** AuthReq deviceId. */
            deviceId: string;

            /** AuthReq platform. */
            platform: string;

            /** AuthReq appVersion. */
            appVersion: string;

            /**
             * Creates a new AuthReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AuthReq instance
             */
            static create(properties: im.auth.AuthReq.$Shape): im.auth.AuthReq & im.auth.AuthReq.$Shape;
            static create(properties?: im.auth.AuthReq.$Properties): im.auth.AuthReq;

            /**
             * Encodes the specified AuthReq message. Does not implicitly {@link im.auth.AuthReq.verify|verify} messages.
             * @param message AuthReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.auth.AuthReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AuthReq message, length delimited. Does not implicitly {@link im.auth.AuthReq.verify|verify} messages.
             * @param message AuthReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.auth.AuthReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AuthReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.auth.AuthReq & im.auth.AuthReq.$Shape} AuthReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.auth.AuthReq & im.auth.AuthReq.$Shape;

            /**
             * Decodes an AuthReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.auth.AuthReq & im.auth.AuthReq.$Shape} AuthReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.auth.AuthReq & im.auth.AuthReq.$Shape;

            /**
             * Verifies an AuthReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AuthReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AuthReq
             */
            static fromObject(object: { [k: string]: any }): im.auth.AuthReq;

            /**
             * Creates a plain object from an AuthReq message. Also converts values to other types if specified.
             * @param message AuthReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.auth.AuthReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AuthReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AuthReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AuthReq {

            /** Properties of an AuthReq. */
            interface $Properties {

                /** AuthReq token */
                token?: (string|null);

                /** AuthReq deviceId */
                deviceId?: (string|null);

                /** AuthReq platform */
                platform?: (string|null);

                /** AuthReq appVersion */
                appVersion?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AuthReq. */
            type $Shape = im.auth.AuthReq.$Properties;
        }

        /**
         * Properties of an AuthResp.
         * @deprecated Use im.auth.AuthResp.$Properties instead.
         */
        interface IAuthResp extends im.auth.AuthResp.$Properties {
        }

        /** Represents an AuthResp. */
        class AuthResp {

            /**
             * Constructs a new AuthResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.auth.AuthResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** AuthResp code. */
            code: number;

            /** AuthResp message. */
            message: string;

            /** AuthResp userId. */
            userId: (number|Long);

            /** AuthResp expireAt. */
            expireAt: (number|Long);

            /**
             * Creates a new AuthResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AuthResp instance
             */
            static create(properties: im.auth.AuthResp.$Shape): im.auth.AuthResp & im.auth.AuthResp.$Shape;
            static create(properties?: im.auth.AuthResp.$Properties): im.auth.AuthResp;

            /**
             * Encodes the specified AuthResp message. Does not implicitly {@link im.auth.AuthResp.verify|verify} messages.
             * @param message AuthResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.auth.AuthResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified AuthResp message, length delimited. Does not implicitly {@link im.auth.AuthResp.verify|verify} messages.
             * @param message AuthResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.auth.AuthResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an AuthResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.auth.AuthResp & im.auth.AuthResp.$Shape} AuthResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.auth.AuthResp & im.auth.AuthResp.$Shape;

            /**
             * Decodes an AuthResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.auth.AuthResp & im.auth.AuthResp.$Shape} AuthResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.auth.AuthResp & im.auth.AuthResp.$Shape;

            /**
             * Verifies an AuthResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an AuthResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AuthResp
             */
            static fromObject(object: { [k: string]: any }): im.auth.AuthResp;

            /**
             * Creates a plain object from an AuthResp message. Also converts values to other types if specified.
             * @param message AuthResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.auth.AuthResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this AuthResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for AuthResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace AuthResp {

            /** Properties of an AuthResp. */
            interface $Properties {

                /** AuthResp code */
                code?: (number|null);

                /** AuthResp message */
                message?: (string|null);

                /** AuthResp userId */
                userId?: (number|Long|null);

                /** AuthResp expireAt */
                expireAt?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an AuthResp. */
            type $Shape = im.auth.AuthResp.$Properties;
        }

        /**
         * Properties of a LogoutReq.
         * @deprecated Use im.auth.LogoutReq.$Properties instead.
         */
        interface ILogoutReq extends im.auth.LogoutReq.$Properties {
        }

        /** Represents a LogoutReq. */
        class LogoutReq {

            /**
             * Constructs a new LogoutReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.auth.LogoutReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** LogoutReq reason. */
            reason: string;

            /**
             * Creates a new LogoutReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LogoutReq instance
             */
            static create(properties: im.auth.LogoutReq.$Shape): im.auth.LogoutReq & im.auth.LogoutReq.$Shape;
            static create(properties?: im.auth.LogoutReq.$Properties): im.auth.LogoutReq;

            /**
             * Encodes the specified LogoutReq message. Does not implicitly {@link im.auth.LogoutReq.verify|verify} messages.
             * @param message LogoutReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.auth.LogoutReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LogoutReq message, length delimited. Does not implicitly {@link im.auth.LogoutReq.verify|verify} messages.
             * @param message LogoutReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.auth.LogoutReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LogoutReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.auth.LogoutReq & im.auth.LogoutReq.$Shape} LogoutReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.auth.LogoutReq & im.auth.LogoutReq.$Shape;

            /**
             * Decodes a LogoutReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.auth.LogoutReq & im.auth.LogoutReq.$Shape} LogoutReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.auth.LogoutReq & im.auth.LogoutReq.$Shape;

            /**
             * Verifies a LogoutReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LogoutReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LogoutReq
             */
            static fromObject(object: { [k: string]: any }): im.auth.LogoutReq;

            /**
             * Creates a plain object from a LogoutReq message. Also converts values to other types if specified.
             * @param message LogoutReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.auth.LogoutReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LogoutReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for LogoutReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace LogoutReq {

            /** Properties of a LogoutReq. */
            interface $Properties {

                /** LogoutReq reason */
                reason?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a LogoutReq. */
            type $Shape = im.auth.LogoutReq.$Properties;
        }

        /**
         * Properties of a LogoutResp.
         * @deprecated Use im.auth.LogoutResp.$Properties instead.
         */
        interface ILogoutResp extends im.auth.LogoutResp.$Properties {
        }

        /** Represents a LogoutResp. */
        class LogoutResp {

            /**
             * Constructs a new LogoutResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.auth.LogoutResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** LogoutResp code. */
            code: number;

            /** LogoutResp message. */
            message: string;

            /**
             * Creates a new LogoutResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LogoutResp instance
             */
            static create(properties: im.auth.LogoutResp.$Shape): im.auth.LogoutResp & im.auth.LogoutResp.$Shape;
            static create(properties?: im.auth.LogoutResp.$Properties): im.auth.LogoutResp;

            /**
             * Encodes the specified LogoutResp message. Does not implicitly {@link im.auth.LogoutResp.verify|verify} messages.
             * @param message LogoutResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.auth.LogoutResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LogoutResp message, length delimited. Does not implicitly {@link im.auth.LogoutResp.verify|verify} messages.
             * @param message LogoutResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.auth.LogoutResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LogoutResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.auth.LogoutResp & im.auth.LogoutResp.$Shape} LogoutResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.auth.LogoutResp & im.auth.LogoutResp.$Shape;

            /**
             * Decodes a LogoutResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.auth.LogoutResp & im.auth.LogoutResp.$Shape} LogoutResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.auth.LogoutResp & im.auth.LogoutResp.$Shape;

            /**
             * Verifies a LogoutResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LogoutResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LogoutResp
             */
            static fromObject(object: { [k: string]: any }): im.auth.LogoutResp;

            /**
             * Creates a plain object from a LogoutResp message. Also converts values to other types if specified.
             * @param message LogoutResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.auth.LogoutResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LogoutResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for LogoutResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace LogoutResp {

            /** Properties of a LogoutResp. */
            interface $Properties {

                /** LogoutResp code */
                code?: (number|null);

                /** LogoutResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a LogoutResp. */
            type $Shape = im.auth.LogoutResp.$Properties;
        }
    }

    /** Namespace call. */
    namespace call {

        /** CallMediaType enum. */
        enum CallMediaType {

            /** CALL_MEDIA_AUDIO value */
            CALL_MEDIA_AUDIO = 0,

            /** CALL_MEDIA_VIDEO value */
            CALL_MEDIA_VIDEO = 1
        }

        /** CallEndReason enum. */
        enum CallEndReason {

            /** END_REASON_UNKNOWN value */
            END_REASON_UNKNOWN = 0,

            /** END_REASON_CANCEL value */
            END_REASON_CANCEL = 1,

            /** END_REASON_REJECT value */
            END_REASON_REJECT = 2,

            /** END_REASON_HANGUP value */
            END_REASON_HANGUP = 3,

            /** END_REASON_BUSY value */
            END_REASON_BUSY = 4,

            /** END_REASON_TIMEOUT value */
            END_REASON_TIMEOUT = 5,

            /** END_REASON_PEER_DROP value */
            END_REASON_PEER_DROP = 6
        }

        /**
         * Properties of a CallInviteReq.
         * @deprecated Use im.call.CallInviteReq.$Properties instead.
         */
        interface ICallInviteReq extends im.call.CallInviteReq.$Properties {
        }

        /** Represents a CallInviteReq. */
        class CallInviteReq {

            /**
             * Constructs a new CallInviteReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallInviteReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallInviteReq peerId. */
            peerId: (number|Long);

            /** CallInviteReq mediaType. */
            mediaType: im.call.CallMediaType;

            /**
             * Creates a new CallInviteReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallInviteReq instance
             */
            static create(properties: im.call.CallInviteReq.$Shape): im.call.CallInviteReq & im.call.CallInviteReq.$Shape;
            static create(properties?: im.call.CallInviteReq.$Properties): im.call.CallInviteReq;

            /**
             * Encodes the specified CallInviteReq message. Does not implicitly {@link im.call.CallInviteReq.verify|verify} messages.
             * @param message CallInviteReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallInviteReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallInviteReq message, length delimited. Does not implicitly {@link im.call.CallInviteReq.verify|verify} messages.
             * @param message CallInviteReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallInviteReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallInviteReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallInviteReq & im.call.CallInviteReq.$Shape} CallInviteReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallInviteReq & im.call.CallInviteReq.$Shape;

            /**
             * Decodes a CallInviteReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallInviteReq & im.call.CallInviteReq.$Shape} CallInviteReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallInviteReq & im.call.CallInviteReq.$Shape;

            /**
             * Verifies a CallInviteReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallInviteReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallInviteReq
             */
            static fromObject(object: { [k: string]: any }): im.call.CallInviteReq;

            /**
             * Creates a plain object from a CallInviteReq message. Also converts values to other types if specified.
             * @param message CallInviteReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallInviteReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallInviteReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallInviteReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallInviteReq {

            /** Properties of a CallInviteReq. */
            interface $Properties {

                /** CallInviteReq peerId */
                peerId?: (number|Long|null);

                /** CallInviteReq mediaType */
                mediaType?: (im.call.CallMediaType|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallInviteReq. */
            type $Shape = im.call.CallInviteReq.$Properties;
        }

        /**
         * Properties of a CallInviteResp.
         * @deprecated Use im.call.CallInviteResp.$Properties instead.
         */
        interface ICallInviteResp extends im.call.CallInviteResp.$Properties {
        }

        /** Represents a CallInviteResp. */
        class CallInviteResp {

            /**
             * Constructs a new CallInviteResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallInviteResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallInviteResp code. */
            code: number;

            /** CallInviteResp message. */
            message: string;

            /** CallInviteResp callId. */
            callId: string;

            /**
             * Creates a new CallInviteResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallInviteResp instance
             */
            static create(properties: im.call.CallInviteResp.$Shape): im.call.CallInviteResp & im.call.CallInviteResp.$Shape;
            static create(properties?: im.call.CallInviteResp.$Properties): im.call.CallInviteResp;

            /**
             * Encodes the specified CallInviteResp message. Does not implicitly {@link im.call.CallInviteResp.verify|verify} messages.
             * @param message CallInviteResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallInviteResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallInviteResp message, length delimited. Does not implicitly {@link im.call.CallInviteResp.verify|verify} messages.
             * @param message CallInviteResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallInviteResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallInviteResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallInviteResp & im.call.CallInviteResp.$Shape} CallInviteResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallInviteResp & im.call.CallInviteResp.$Shape;

            /**
             * Decodes a CallInviteResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallInviteResp & im.call.CallInviteResp.$Shape} CallInviteResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallInviteResp & im.call.CallInviteResp.$Shape;

            /**
             * Verifies a CallInviteResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallInviteResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallInviteResp
             */
            static fromObject(object: { [k: string]: any }): im.call.CallInviteResp;

            /**
             * Creates a plain object from a CallInviteResp message. Also converts values to other types if specified.
             * @param message CallInviteResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallInviteResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallInviteResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallInviteResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallInviteResp {

            /** Properties of a CallInviteResp. */
            interface $Properties {

                /** CallInviteResp code */
                code?: (number|null);

                /** CallInviteResp message */
                message?: (string|null);

                /** CallInviteResp callId */
                callId?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallInviteResp. */
            type $Shape = im.call.CallInviteResp.$Properties;
        }

        /**
         * Properties of a CallAcceptReq.
         * @deprecated Use im.call.CallAcceptReq.$Properties instead.
         */
        interface ICallAcceptReq extends im.call.CallAcceptReq.$Properties {
        }

        /** Represents a CallAcceptReq. */
        class CallAcceptReq {

            /**
             * Constructs a new CallAcceptReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallAcceptReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallAcceptReq callId. */
            callId: string;

            /**
             * Creates a new CallAcceptReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallAcceptReq instance
             */
            static create(properties: im.call.CallAcceptReq.$Shape): im.call.CallAcceptReq & im.call.CallAcceptReq.$Shape;
            static create(properties?: im.call.CallAcceptReq.$Properties): im.call.CallAcceptReq;

            /**
             * Encodes the specified CallAcceptReq message. Does not implicitly {@link im.call.CallAcceptReq.verify|verify} messages.
             * @param message CallAcceptReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallAcceptReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallAcceptReq message, length delimited. Does not implicitly {@link im.call.CallAcceptReq.verify|verify} messages.
             * @param message CallAcceptReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallAcceptReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallAcceptReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallAcceptReq & im.call.CallAcceptReq.$Shape} CallAcceptReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallAcceptReq & im.call.CallAcceptReq.$Shape;

            /**
             * Decodes a CallAcceptReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallAcceptReq & im.call.CallAcceptReq.$Shape} CallAcceptReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallAcceptReq & im.call.CallAcceptReq.$Shape;

            /**
             * Verifies a CallAcceptReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallAcceptReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallAcceptReq
             */
            static fromObject(object: { [k: string]: any }): im.call.CallAcceptReq;

            /**
             * Creates a plain object from a CallAcceptReq message. Also converts values to other types if specified.
             * @param message CallAcceptReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallAcceptReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallAcceptReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallAcceptReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallAcceptReq {

            /** Properties of a CallAcceptReq. */
            interface $Properties {

                /** CallAcceptReq callId */
                callId?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallAcceptReq. */
            type $Shape = im.call.CallAcceptReq.$Properties;
        }

        /**
         * Properties of a CallAcceptResp.
         * @deprecated Use im.call.CallAcceptResp.$Properties instead.
         */
        interface ICallAcceptResp extends im.call.CallAcceptResp.$Properties {
        }

        /** Represents a CallAcceptResp. */
        class CallAcceptResp {

            /**
             * Constructs a new CallAcceptResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallAcceptResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallAcceptResp code. */
            code: number;

            /** CallAcceptResp message. */
            message: string;

            /** CallAcceptResp room. */
            room: string;

            /** CallAcceptResp token. */
            token: string;

            /** CallAcceptResp wsUrl. */
            wsUrl: string;

            /**
             * Creates a new CallAcceptResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallAcceptResp instance
             */
            static create(properties: im.call.CallAcceptResp.$Shape): im.call.CallAcceptResp & im.call.CallAcceptResp.$Shape;
            static create(properties?: im.call.CallAcceptResp.$Properties): im.call.CallAcceptResp;

            /**
             * Encodes the specified CallAcceptResp message. Does not implicitly {@link im.call.CallAcceptResp.verify|verify} messages.
             * @param message CallAcceptResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallAcceptResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallAcceptResp message, length delimited. Does not implicitly {@link im.call.CallAcceptResp.verify|verify} messages.
             * @param message CallAcceptResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallAcceptResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallAcceptResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallAcceptResp & im.call.CallAcceptResp.$Shape} CallAcceptResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallAcceptResp & im.call.CallAcceptResp.$Shape;

            /**
             * Decodes a CallAcceptResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallAcceptResp & im.call.CallAcceptResp.$Shape} CallAcceptResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallAcceptResp & im.call.CallAcceptResp.$Shape;

            /**
             * Verifies a CallAcceptResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallAcceptResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallAcceptResp
             */
            static fromObject(object: { [k: string]: any }): im.call.CallAcceptResp;

            /**
             * Creates a plain object from a CallAcceptResp message. Also converts values to other types if specified.
             * @param message CallAcceptResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallAcceptResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallAcceptResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallAcceptResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallAcceptResp {

            /** Properties of a CallAcceptResp. */
            interface $Properties {

                /** CallAcceptResp code */
                code?: (number|null);

                /** CallAcceptResp message */
                message?: (string|null);

                /** CallAcceptResp room */
                room?: (string|null);

                /** CallAcceptResp token */
                token?: (string|null);

                /** CallAcceptResp wsUrl */
                wsUrl?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallAcceptResp. */
            type $Shape = im.call.CallAcceptResp.$Properties;
        }

        /**
         * Properties of a CallEndReq.
         * @deprecated Use im.call.CallEndReq.$Properties instead.
         */
        interface ICallEndReq extends im.call.CallEndReq.$Properties {
        }

        /** Represents a CallEndReq. */
        class CallEndReq {

            /**
             * Constructs a new CallEndReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallEndReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallEndReq callId. */
            callId: string;

            /** CallEndReq reason. */
            reason: im.call.CallEndReason;

            /**
             * Creates a new CallEndReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallEndReq instance
             */
            static create(properties: im.call.CallEndReq.$Shape): im.call.CallEndReq & im.call.CallEndReq.$Shape;
            static create(properties?: im.call.CallEndReq.$Properties): im.call.CallEndReq;

            /**
             * Encodes the specified CallEndReq message. Does not implicitly {@link im.call.CallEndReq.verify|verify} messages.
             * @param message CallEndReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallEndReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallEndReq message, length delimited. Does not implicitly {@link im.call.CallEndReq.verify|verify} messages.
             * @param message CallEndReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallEndReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallEndReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallEndReq & im.call.CallEndReq.$Shape} CallEndReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallEndReq & im.call.CallEndReq.$Shape;

            /**
             * Decodes a CallEndReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallEndReq & im.call.CallEndReq.$Shape} CallEndReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallEndReq & im.call.CallEndReq.$Shape;

            /**
             * Verifies a CallEndReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallEndReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallEndReq
             */
            static fromObject(object: { [k: string]: any }): im.call.CallEndReq;

            /**
             * Creates a plain object from a CallEndReq message. Also converts values to other types if specified.
             * @param message CallEndReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallEndReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallEndReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallEndReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallEndReq {

            /** Properties of a CallEndReq. */
            interface $Properties {

                /** CallEndReq callId */
                callId?: (string|null);

                /** CallEndReq reason */
                reason?: (im.call.CallEndReason|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallEndReq. */
            type $Shape = im.call.CallEndReq.$Properties;
        }

        /**
         * Properties of a CallEndResp.
         * @deprecated Use im.call.CallEndResp.$Properties instead.
         */
        interface ICallEndResp extends im.call.CallEndResp.$Properties {
        }

        /** Represents a CallEndResp. */
        class CallEndResp {

            /**
             * Constructs a new CallEndResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallEndResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallEndResp code. */
            code: number;

            /** CallEndResp message. */
            message: string;

            /**
             * Creates a new CallEndResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallEndResp instance
             */
            static create(properties: im.call.CallEndResp.$Shape): im.call.CallEndResp & im.call.CallEndResp.$Shape;
            static create(properties?: im.call.CallEndResp.$Properties): im.call.CallEndResp;

            /**
             * Encodes the specified CallEndResp message. Does not implicitly {@link im.call.CallEndResp.verify|verify} messages.
             * @param message CallEndResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallEndResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallEndResp message, length delimited. Does not implicitly {@link im.call.CallEndResp.verify|verify} messages.
             * @param message CallEndResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallEndResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallEndResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallEndResp & im.call.CallEndResp.$Shape} CallEndResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallEndResp & im.call.CallEndResp.$Shape;

            /**
             * Decodes a CallEndResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallEndResp & im.call.CallEndResp.$Shape} CallEndResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallEndResp & im.call.CallEndResp.$Shape;

            /**
             * Verifies a CallEndResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallEndResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallEndResp
             */
            static fromObject(object: { [k: string]: any }): im.call.CallEndResp;

            /**
             * Creates a plain object from a CallEndResp message. Also converts values to other types if specified.
             * @param message CallEndResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallEndResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallEndResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallEndResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallEndResp {

            /** Properties of a CallEndResp. */
            interface $Properties {

                /** CallEndResp code */
                code?: (number|null);

                /** CallEndResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallEndResp. */
            type $Shape = im.call.CallEndResp.$Properties;
        }

        /**
         * Properties of a CallEventPush.
         * @deprecated Use im.call.CallEventPush.$Properties instead.
         */
        interface ICallEventPush extends im.call.CallEventPush.$Properties {
        }

        /** Represents a CallEventPush. */
        class CallEventPush {

            /**
             * Constructs a new CallEventPush.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallEventPush.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallEventPush callId. */
            callId: string;

            /** CallEventPush event. */
            event: number;

            /** CallEventPush mediaType. */
            mediaType: im.call.CallMediaType;

            /** CallEventPush peerId. */
            peerId: (number|Long);

            /** CallEventPush peerUserName. */
            peerUserName: string;

            /** CallEventPush peerNickname. */
            peerNickname: string;

            /** CallEventPush reason. */
            reason: im.call.CallEndReason;

            /** CallEventPush room. */
            room: string;

            /** CallEventPush token. */
            token: string;

            /** CallEventPush wsUrl. */
            wsUrl: string;

            /**
             * Creates a new CallEventPush instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallEventPush instance
             */
            static create(properties: im.call.CallEventPush.$Shape): im.call.CallEventPush & im.call.CallEventPush.$Shape;
            static create(properties?: im.call.CallEventPush.$Properties): im.call.CallEventPush;

            /**
             * Encodes the specified CallEventPush message. Does not implicitly {@link im.call.CallEventPush.verify|verify} messages.
             * @param message CallEventPush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallEventPush.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallEventPush message, length delimited. Does not implicitly {@link im.call.CallEventPush.verify|verify} messages.
             * @param message CallEventPush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallEventPush.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallEventPush message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallEventPush & im.call.CallEventPush.$Shape} CallEventPush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallEventPush & im.call.CallEventPush.$Shape;

            /**
             * Decodes a CallEventPush message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallEventPush & im.call.CallEventPush.$Shape} CallEventPush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallEventPush & im.call.CallEventPush.$Shape;

            /**
             * Verifies a CallEventPush message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallEventPush message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallEventPush
             */
            static fromObject(object: { [k: string]: any }): im.call.CallEventPush;

            /**
             * Creates a plain object from a CallEventPush message. Also converts values to other types if specified.
             * @param message CallEventPush
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallEventPush, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallEventPush to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallEventPush
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallEventPush {

            /** Properties of a CallEventPush. */
            interface $Properties {

                /** CallEventPush callId */
                callId?: (string|null);

                /** CallEventPush event */
                event?: (number|null);

                /** CallEventPush mediaType */
                mediaType?: (im.call.CallMediaType|null);

                /** CallEventPush peerId */
                peerId?: (number|Long|null);

                /** CallEventPush peerUserName */
                peerUserName?: (string|null);

                /** CallEventPush peerNickname */
                peerNickname?: (string|null);

                /** CallEventPush reason */
                reason?: (im.call.CallEndReason|null);

                /** CallEventPush room */
                room?: (string|null);

                /** CallEventPush token */
                token?: (string|null);

                /** CallEventPush wsUrl */
                wsUrl?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallEventPush. */
            type $Shape = im.call.CallEventPush.$Properties;
        }

        /**
         * Properties of a CallTokenReq.
         * @deprecated Use im.call.CallTokenReq.$Properties instead.
         */
        interface ICallTokenReq extends im.call.CallTokenReq.$Properties {
        }

        /** Represents a CallTokenReq. */
        class CallTokenReq {

            /**
             * Constructs a new CallTokenReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallTokenReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallTokenReq callId. */
            callId: string;

            /**
             * Creates a new CallTokenReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallTokenReq instance
             */
            static create(properties: im.call.CallTokenReq.$Shape): im.call.CallTokenReq & im.call.CallTokenReq.$Shape;
            static create(properties?: im.call.CallTokenReq.$Properties): im.call.CallTokenReq;

            /**
             * Encodes the specified CallTokenReq message. Does not implicitly {@link im.call.CallTokenReq.verify|verify} messages.
             * @param message CallTokenReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallTokenReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallTokenReq message, length delimited. Does not implicitly {@link im.call.CallTokenReq.verify|verify} messages.
             * @param message CallTokenReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallTokenReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallTokenReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallTokenReq & im.call.CallTokenReq.$Shape} CallTokenReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallTokenReq & im.call.CallTokenReq.$Shape;

            /**
             * Decodes a CallTokenReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallTokenReq & im.call.CallTokenReq.$Shape} CallTokenReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallTokenReq & im.call.CallTokenReq.$Shape;

            /**
             * Verifies a CallTokenReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallTokenReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallTokenReq
             */
            static fromObject(object: { [k: string]: any }): im.call.CallTokenReq;

            /**
             * Creates a plain object from a CallTokenReq message. Also converts values to other types if specified.
             * @param message CallTokenReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallTokenReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallTokenReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallTokenReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallTokenReq {

            /** Properties of a CallTokenReq. */
            interface $Properties {

                /** CallTokenReq callId */
                callId?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallTokenReq. */
            type $Shape = im.call.CallTokenReq.$Properties;
        }

        /**
         * Properties of a CallTokenResp.
         * @deprecated Use im.call.CallTokenResp.$Properties instead.
         */
        interface ICallTokenResp extends im.call.CallTokenResp.$Properties {
        }

        /** Represents a CallTokenResp. */
        class CallTokenResp {

            /**
             * Constructs a new CallTokenResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.call.CallTokenResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CallTokenResp code. */
            code: number;

            /** CallTokenResp message. */
            message: string;

            /** CallTokenResp room. */
            room: string;

            /** CallTokenResp token. */
            token: string;

            /** CallTokenResp wsUrl. */
            wsUrl: string;

            /**
             * Creates a new CallTokenResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CallTokenResp instance
             */
            static create(properties: im.call.CallTokenResp.$Shape): im.call.CallTokenResp & im.call.CallTokenResp.$Shape;
            static create(properties?: im.call.CallTokenResp.$Properties): im.call.CallTokenResp;

            /**
             * Encodes the specified CallTokenResp message. Does not implicitly {@link im.call.CallTokenResp.verify|verify} messages.
             * @param message CallTokenResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.call.CallTokenResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CallTokenResp message, length delimited. Does not implicitly {@link im.call.CallTokenResp.verify|verify} messages.
             * @param message CallTokenResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.call.CallTokenResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CallTokenResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.call.CallTokenResp & im.call.CallTokenResp.$Shape} CallTokenResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.call.CallTokenResp & im.call.CallTokenResp.$Shape;

            /**
             * Decodes a CallTokenResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.call.CallTokenResp & im.call.CallTokenResp.$Shape} CallTokenResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.call.CallTokenResp & im.call.CallTokenResp.$Shape;

            /**
             * Verifies a CallTokenResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CallTokenResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CallTokenResp
             */
            static fromObject(object: { [k: string]: any }): im.call.CallTokenResp;

            /**
             * Creates a plain object from a CallTokenResp message. Also converts values to other types if specified.
             * @param message CallTokenResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.call.CallTokenResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CallTokenResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CallTokenResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CallTokenResp {

            /** Properties of a CallTokenResp. */
            interface $Properties {

                /** CallTokenResp code */
                code?: (number|null);

                /** CallTokenResp message */
                message?: (string|null);

                /** CallTokenResp room */
                room?: (string|null);

                /** CallTokenResp token */
                token?: (string|null);

                /** CallTokenResp wsUrl */
                wsUrl?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CallTokenResp. */
            type $Shape = im.call.CallTokenResp.$Properties;
        }
    }

    /** Namespace chat. */
    namespace chat {

        /**
         * Properties of a C2CReq.
         * @deprecated Use im.chat.C2CReq.$Properties instead.
         */
        interface IC2CReq extends im.chat.C2CReq.$Properties {
        }

        /** Represents a C2CReq. */
        class C2CReq {

            /**
             * Constructs a new C2CReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.chat.C2CReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** C2CReq senderId. */
            senderId: (number|Long);

            /** C2CReq recipientId. */
            recipientId: (number|Long);

            /** C2CReq messageId. */
            messageId: (number|Long);

            /** C2CReq message. */
            message?: (im.common.MessageContent.$Properties|null);

            /**
             * Creates a new C2CReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns C2CReq instance
             */
            static create(properties: im.chat.C2CReq.$Shape): im.chat.C2CReq & im.chat.C2CReq.$Shape;
            static create(properties?: im.chat.C2CReq.$Properties): im.chat.C2CReq;

            /**
             * Encodes the specified C2CReq message. Does not implicitly {@link im.chat.C2CReq.verify|verify} messages.
             * @param message C2CReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.chat.C2CReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified C2CReq message, length delimited. Does not implicitly {@link im.chat.C2CReq.verify|verify} messages.
             * @param message C2CReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.chat.C2CReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a C2CReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.chat.C2CReq & im.chat.C2CReq.$Shape} C2CReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.chat.C2CReq & im.chat.C2CReq.$Shape;

            /**
             * Decodes a C2CReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.chat.C2CReq & im.chat.C2CReq.$Shape} C2CReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.chat.C2CReq & im.chat.C2CReq.$Shape;

            /**
             * Verifies a C2CReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a C2CReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns C2CReq
             */
            static fromObject(object: { [k: string]: any }): im.chat.C2CReq;

            /**
             * Creates a plain object from a C2CReq message. Also converts values to other types if specified.
             * @param message C2CReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.chat.C2CReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this C2CReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for C2CReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace C2CReq {

            /** Properties of a C2CReq. */
            interface $Properties {

                /** C2CReq senderId */
                senderId?: (number|Long|null);

                /** C2CReq recipientId */
                recipientId?: (number|Long|null);

                /** C2CReq messageId */
                messageId?: (number|Long|null);

                /** C2CReq message */
                message?: (im.common.MessageContent.$Properties|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a C2CReq. */
            type $Shape = im.chat.C2CReq.$Properties;
        }

        /**
         * Properties of a C2CResp.
         * @deprecated Use im.chat.C2CResp.$Properties instead.
         */
        interface IC2CResp extends im.chat.C2CResp.$Properties {
        }

        /** Represents a C2CResp. */
        class C2CResp {

            /**
             * Constructs a new C2CResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.chat.C2CResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** C2CResp code. */
            code: number;

            /** C2CResp message. */
            message: string;

            /** C2CResp messageId. */
            messageId: (number|Long);

            /** C2CResp serverTime. */
            serverTime: (number|Long);

            /** C2CResp seq. */
            seq?: (number|Long|null);

            /**
             * Creates a new C2CResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns C2CResp instance
             */
            static create(properties: im.chat.C2CResp.$Shape): im.chat.C2CResp & im.chat.C2CResp.$Shape;
            static create(properties?: im.chat.C2CResp.$Properties): im.chat.C2CResp;

            /**
             * Encodes the specified C2CResp message. Does not implicitly {@link im.chat.C2CResp.verify|verify} messages.
             * @param message C2CResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.chat.C2CResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified C2CResp message, length delimited. Does not implicitly {@link im.chat.C2CResp.verify|verify} messages.
             * @param message C2CResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.chat.C2CResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a C2CResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.chat.C2CResp & im.chat.C2CResp.$Shape} C2CResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.chat.C2CResp & im.chat.C2CResp.$Shape;

            /**
             * Decodes a C2CResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.chat.C2CResp & im.chat.C2CResp.$Shape} C2CResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.chat.C2CResp & im.chat.C2CResp.$Shape;

            /**
             * Verifies a C2CResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a C2CResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns C2CResp
             */
            static fromObject(object: { [k: string]: any }): im.chat.C2CResp;

            /**
             * Creates a plain object from a C2CResp message. Also converts values to other types if specified.
             * @param message C2CResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.chat.C2CResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this C2CResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for C2CResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace C2CResp {

            /** Properties of a C2CResp. */
            interface $Properties {

                /** C2CResp code */
                code?: (number|null);

                /** C2CResp message */
                message?: (string|null);

                /** C2CResp messageId */
                messageId?: (number|Long|null);

                /** C2CResp serverTime */
                serverTime?: (number|Long|null);

                /** C2CResp seq */
                seq?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a C2CResp. */
            type $Shape = im.chat.C2CResp.$Properties;
        }

        /**
         * Properties of a C2CNotify.
         * @deprecated Use im.chat.C2CNotify.$Properties instead.
         */
        interface IC2CNotify extends im.chat.C2CNotify.$Properties {
        }

        /** Represents a C2CNotify. */
        class C2CNotify {

            /**
             * Constructs a new C2CNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.chat.C2CNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** C2CNotify senderId. */
            senderId: (number|Long);

            /** C2CNotify recipientId. */
            recipientId: (number|Long);

            /** C2CNotify message. */
            message?: (im.common.MessageContent.$Properties|null);

            /** C2CNotify seq. */
            seq?: (number|Long|null);

            /** C2CNotify messageId. */
            messageId?: (number|Long|null);

            /**
             * Creates a new C2CNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns C2CNotify instance
             */
            static create(properties: im.chat.C2CNotify.$Shape): im.chat.C2CNotify & im.chat.C2CNotify.$Shape;
            static create(properties?: im.chat.C2CNotify.$Properties): im.chat.C2CNotify;

            /**
             * Encodes the specified C2CNotify message. Does not implicitly {@link im.chat.C2CNotify.verify|verify} messages.
             * @param message C2CNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.chat.C2CNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified C2CNotify message, length delimited. Does not implicitly {@link im.chat.C2CNotify.verify|verify} messages.
             * @param message C2CNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.chat.C2CNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a C2CNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.chat.C2CNotify & im.chat.C2CNotify.$Shape} C2CNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.chat.C2CNotify & im.chat.C2CNotify.$Shape;

            /**
             * Decodes a C2CNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.chat.C2CNotify & im.chat.C2CNotify.$Shape} C2CNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.chat.C2CNotify & im.chat.C2CNotify.$Shape;

            /**
             * Verifies a C2CNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a C2CNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns C2CNotify
             */
            static fromObject(object: { [k: string]: any }): im.chat.C2CNotify;

            /**
             * Creates a plain object from a C2CNotify message. Also converts values to other types if specified.
             * @param message C2CNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.chat.C2CNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this C2CNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for C2CNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace C2CNotify {

            /** Properties of a C2CNotify. */
            interface $Properties {

                /** C2CNotify senderId */
                senderId?: (number|Long|null);

                /** C2CNotify recipientId */
                recipientId?: (number|Long|null);

                /** C2CNotify message */
                message?: (im.common.MessageContent.$Properties|null);

                /** C2CNotify seq */
                seq?: (number|Long|null);

                /** C2CNotify messageId */
                messageId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a C2CNotify. */
            type $Shape = im.chat.C2CNotify.$Properties;
        }
    }

    /** Namespace ctrl. */
    namespace ctrl {

        /** CtrlType enum. */
        enum CtrlType {

            /** CTRL_TYPE_UNKNOWN value */
            CTRL_TYPE_UNKNOWN = 0,

            /** CTRL_TYPE_KICK_OFFLINE value */
            CTRL_TYPE_KICK_OFFLINE = 1,

            /** CTRL_TYPE_FORCE_LOGOUT value */
            CTRL_TYPE_FORCE_LOGOUT = 2,

            /** CTRL_TYPE_NOTIFY value */
            CTRL_TYPE_NOTIFY = 3,

            /** CTRL_TYPE_SYNC value */
            CTRL_TYPE_SYNC = 4
        }

        /**
         * Properties of a CtrlReq.
         * @deprecated Use im.ctrl.CtrlReq.$Properties instead.
         */
        interface ICtrlReq extends im.ctrl.CtrlReq.$Properties {
        }

        /** Represents a CtrlReq. */
        class CtrlReq {

            /**
             * Constructs a new CtrlReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.ctrl.CtrlReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CtrlReq ctrlType. */
            ctrlType: im.ctrl.CtrlType;

            /** CtrlReq targetUser. */
            targetUser: string;

            /** CtrlReq payload. */
            payload?: (Uint8Array|null);

            /**
             * Creates a new CtrlReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CtrlReq instance
             */
            static create(properties: im.ctrl.CtrlReq.$Shape): im.ctrl.CtrlReq & im.ctrl.CtrlReq.$Shape;
            static create(properties?: im.ctrl.CtrlReq.$Properties): im.ctrl.CtrlReq;

            /**
             * Encodes the specified CtrlReq message. Does not implicitly {@link im.ctrl.CtrlReq.verify|verify} messages.
             * @param message CtrlReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.ctrl.CtrlReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CtrlReq message, length delimited. Does not implicitly {@link im.ctrl.CtrlReq.verify|verify} messages.
             * @param message CtrlReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.ctrl.CtrlReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CtrlReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.ctrl.CtrlReq & im.ctrl.CtrlReq.$Shape} CtrlReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.ctrl.CtrlReq & im.ctrl.CtrlReq.$Shape;

            /**
             * Decodes a CtrlReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.ctrl.CtrlReq & im.ctrl.CtrlReq.$Shape} CtrlReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.ctrl.CtrlReq & im.ctrl.CtrlReq.$Shape;

            /**
             * Verifies a CtrlReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CtrlReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CtrlReq
             */
            static fromObject(object: { [k: string]: any }): im.ctrl.CtrlReq;

            /**
             * Creates a plain object from a CtrlReq message. Also converts values to other types if specified.
             * @param message CtrlReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.ctrl.CtrlReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CtrlReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CtrlReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CtrlReq {

            /** Properties of a CtrlReq. */
            interface $Properties {

                /** CtrlReq ctrlType */
                ctrlType?: (im.ctrl.CtrlType|null);

                /** CtrlReq targetUser */
                targetUser?: (string|null);

                /** CtrlReq payload */
                payload?: (Uint8Array|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CtrlReq. */
            type $Shape = im.ctrl.CtrlReq.$Properties;
        }

        /**
         * Properties of a CtrlResp.
         * @deprecated Use im.ctrl.CtrlResp.$Properties instead.
         */
        interface ICtrlResp extends im.ctrl.CtrlResp.$Properties {
        }

        /** Represents a CtrlResp. */
        class CtrlResp {

            /**
             * Constructs a new CtrlResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.ctrl.CtrlResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CtrlResp code. */
            code: number;

            /** CtrlResp message. */
            message: string;

            /** CtrlResp payload. */
            payload: Uint8Array;

            /**
             * Creates a new CtrlResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CtrlResp instance
             */
            static create(properties: im.ctrl.CtrlResp.$Shape): im.ctrl.CtrlResp & im.ctrl.CtrlResp.$Shape;
            static create(properties?: im.ctrl.CtrlResp.$Properties): im.ctrl.CtrlResp;

            /**
             * Encodes the specified CtrlResp message. Does not implicitly {@link im.ctrl.CtrlResp.verify|verify} messages.
             * @param message CtrlResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.ctrl.CtrlResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CtrlResp message, length delimited. Does not implicitly {@link im.ctrl.CtrlResp.verify|verify} messages.
             * @param message CtrlResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.ctrl.CtrlResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CtrlResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.ctrl.CtrlResp & im.ctrl.CtrlResp.$Shape} CtrlResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.ctrl.CtrlResp & im.ctrl.CtrlResp.$Shape;

            /**
             * Decodes a CtrlResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.ctrl.CtrlResp & im.ctrl.CtrlResp.$Shape} CtrlResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.ctrl.CtrlResp & im.ctrl.CtrlResp.$Shape;

            /**
             * Verifies a CtrlResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CtrlResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CtrlResp
             */
            static fromObject(object: { [k: string]: any }): im.ctrl.CtrlResp;

            /**
             * Creates a plain object from a CtrlResp message. Also converts values to other types if specified.
             * @param message CtrlResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.ctrl.CtrlResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CtrlResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CtrlResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CtrlResp {

            /** Properties of a CtrlResp. */
            interface $Properties {

                /** CtrlResp code */
                code?: (number|null);

                /** CtrlResp message */
                message?: (string|null);

                /** CtrlResp payload */
                payload?: (Uint8Array|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CtrlResp. */
            type $Shape = im.ctrl.CtrlResp.$Properties;
        }

        /**
         * Properties of a CtrlNotify.
         * @deprecated Use im.ctrl.CtrlNotify.$Properties instead.
         */
        interface ICtrlNotify extends im.ctrl.CtrlNotify.$Properties {
        }

        /** Represents a CtrlNotify. */
        class CtrlNotify {

            /**
             * Constructs a new CtrlNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.ctrl.CtrlNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CtrlNotify ctrlType. */
            ctrlType: im.ctrl.CtrlType;

            /** CtrlNotify reason. */
            reason: string;

            /** CtrlNotify payload. */
            payload: Uint8Array;

            /**
             * Creates a new CtrlNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CtrlNotify instance
             */
            static create(properties: im.ctrl.CtrlNotify.$Shape): im.ctrl.CtrlNotify & im.ctrl.CtrlNotify.$Shape;
            static create(properties?: im.ctrl.CtrlNotify.$Properties): im.ctrl.CtrlNotify;

            /**
             * Encodes the specified CtrlNotify message. Does not implicitly {@link im.ctrl.CtrlNotify.verify|verify} messages.
             * @param message CtrlNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.ctrl.CtrlNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CtrlNotify message, length delimited. Does not implicitly {@link im.ctrl.CtrlNotify.verify|verify} messages.
             * @param message CtrlNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.ctrl.CtrlNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CtrlNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.ctrl.CtrlNotify & im.ctrl.CtrlNotify.$Shape} CtrlNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.ctrl.CtrlNotify & im.ctrl.CtrlNotify.$Shape;

            /**
             * Decodes a CtrlNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.ctrl.CtrlNotify & im.ctrl.CtrlNotify.$Shape} CtrlNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.ctrl.CtrlNotify & im.ctrl.CtrlNotify.$Shape;

            /**
             * Verifies a CtrlNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CtrlNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CtrlNotify
             */
            static fromObject(object: { [k: string]: any }): im.ctrl.CtrlNotify;

            /**
             * Creates a plain object from a CtrlNotify message. Also converts values to other types if specified.
             * @param message CtrlNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.ctrl.CtrlNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CtrlNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CtrlNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CtrlNotify {

            /** Properties of a CtrlNotify. */
            interface $Properties {

                /** CtrlNotify ctrlType */
                ctrlType?: (im.ctrl.CtrlType|null);

                /** CtrlNotify reason */
                reason?: (string|null);

                /** CtrlNotify payload */
                payload?: (Uint8Array|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CtrlNotify. */
            type $Shape = im.ctrl.CtrlNotify.$Properties;
        }
    }

    /** Namespace group. */
    namespace group {

        /**
         * Properties of a C2GReq.
         * @deprecated Use im.group.C2GReq.$Properties instead.
         */
        interface IC2GReq extends im.group.C2GReq.$Properties {
        }

        /** Represents a C2GReq. */
        class C2GReq {

            /**
             * Constructs a new C2GReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.C2GReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** C2GReq senderId. */
            senderId: (number|Long);

            /** C2GReq groupId. */
            groupId: (number|Long);

            /** C2GReq messageId. */
            messageId: (number|Long);

            /** C2GReq message. */
            message?: (im.common.MessageContent.$Properties|null);

            /**
             * Creates a new C2GReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns C2GReq instance
             */
            static create(properties: im.group.C2GReq.$Shape): im.group.C2GReq & im.group.C2GReq.$Shape;
            static create(properties?: im.group.C2GReq.$Properties): im.group.C2GReq;

            /**
             * Encodes the specified C2GReq message. Does not implicitly {@link im.group.C2GReq.verify|verify} messages.
             * @param message C2GReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.C2GReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified C2GReq message, length delimited. Does not implicitly {@link im.group.C2GReq.verify|verify} messages.
             * @param message C2GReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.C2GReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a C2GReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.C2GReq & im.group.C2GReq.$Shape} C2GReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.C2GReq & im.group.C2GReq.$Shape;

            /**
             * Decodes a C2GReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.C2GReq & im.group.C2GReq.$Shape} C2GReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.C2GReq & im.group.C2GReq.$Shape;

            /**
             * Verifies a C2GReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a C2GReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns C2GReq
             */
            static fromObject(object: { [k: string]: any }): im.group.C2GReq;

            /**
             * Creates a plain object from a C2GReq message. Also converts values to other types if specified.
             * @param message C2GReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.C2GReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this C2GReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for C2GReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace C2GReq {

            /** Properties of a C2GReq. */
            interface $Properties {

                /** C2GReq senderId */
                senderId?: (number|Long|null);

                /** C2GReq groupId */
                groupId?: (number|Long|null);

                /** C2GReq messageId */
                messageId?: (number|Long|null);

                /** C2GReq message */
                message?: (im.common.MessageContent.$Properties|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a C2GReq. */
            type $Shape = im.group.C2GReq.$Properties;
        }

        /**
         * Properties of a C2GResp.
         * @deprecated Use im.group.C2GResp.$Properties instead.
         */
        interface IC2GResp extends im.group.C2GResp.$Properties {
        }

        /** Represents a C2GResp. */
        class C2GResp {

            /**
             * Constructs a new C2GResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.C2GResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** C2GResp code. */
            code: number;

            /** C2GResp message. */
            message: string;

            /** C2GResp messageId. */
            messageId: (number|Long);

            /** C2GResp groupId. */
            groupId: (number|Long);

            /** C2GResp serverTime. */
            serverTime: (number|Long);

            /** C2GResp seq. */
            seq?: (number|Long|null);

            /**
             * Creates a new C2GResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns C2GResp instance
             */
            static create(properties: im.group.C2GResp.$Shape): im.group.C2GResp & im.group.C2GResp.$Shape;
            static create(properties?: im.group.C2GResp.$Properties): im.group.C2GResp;

            /**
             * Encodes the specified C2GResp message. Does not implicitly {@link im.group.C2GResp.verify|verify} messages.
             * @param message C2GResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.C2GResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified C2GResp message, length delimited. Does not implicitly {@link im.group.C2GResp.verify|verify} messages.
             * @param message C2GResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.C2GResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a C2GResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.C2GResp & im.group.C2GResp.$Shape} C2GResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.C2GResp & im.group.C2GResp.$Shape;

            /**
             * Decodes a C2GResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.C2GResp & im.group.C2GResp.$Shape} C2GResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.C2GResp & im.group.C2GResp.$Shape;

            /**
             * Verifies a C2GResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a C2GResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns C2GResp
             */
            static fromObject(object: { [k: string]: any }): im.group.C2GResp;

            /**
             * Creates a plain object from a C2GResp message. Also converts values to other types if specified.
             * @param message C2GResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.C2GResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this C2GResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for C2GResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace C2GResp {

            /** Properties of a C2GResp. */
            interface $Properties {

                /** C2GResp code */
                code?: (number|null);

                /** C2GResp message */
                message?: (string|null);

                /** C2GResp messageId */
                messageId?: (number|Long|null);

                /** C2GResp groupId */
                groupId?: (number|Long|null);

                /** C2GResp serverTime */
                serverTime?: (number|Long|null);

                /** C2GResp seq */
                seq?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a C2GResp. */
            type $Shape = im.group.C2GResp.$Properties;
        }

        /**
         * Properties of a C2GNotify.
         * @deprecated Use im.group.C2GNotify.$Properties instead.
         */
        interface IC2GNotify extends im.group.C2GNotify.$Properties {
        }

        /** Represents a C2GNotify. */
        class C2GNotify {

            /**
             * Constructs a new C2GNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.C2GNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** C2GNotify senderId. */
            senderId: (number|Long);

            /** C2GNotify groupId. */
            groupId: (number|Long);

            /** C2GNotify message. */
            message?: (im.common.MessageContent.$Properties|null);

            /** C2GNotify name. */
            name?: (string|null);

            /** C2GNotify seq. */
            seq?: (number|Long|null);

            /** C2GNotify messageId. */
            messageId?: (number|Long|null);

            /**
             * Creates a new C2GNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns C2GNotify instance
             */
            static create(properties: im.group.C2GNotify.$Shape): im.group.C2GNotify & im.group.C2GNotify.$Shape;
            static create(properties?: im.group.C2GNotify.$Properties): im.group.C2GNotify;

            /**
             * Encodes the specified C2GNotify message. Does not implicitly {@link im.group.C2GNotify.verify|verify} messages.
             * @param message C2GNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.C2GNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified C2GNotify message, length delimited. Does not implicitly {@link im.group.C2GNotify.verify|verify} messages.
             * @param message C2GNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.C2GNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a C2GNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.C2GNotify & im.group.C2GNotify.$Shape} C2GNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.C2GNotify & im.group.C2GNotify.$Shape;

            /**
             * Decodes a C2GNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.C2GNotify & im.group.C2GNotify.$Shape} C2GNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.C2GNotify & im.group.C2GNotify.$Shape;

            /**
             * Verifies a C2GNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a C2GNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns C2GNotify
             */
            static fromObject(object: { [k: string]: any }): im.group.C2GNotify;

            /**
             * Creates a plain object from a C2GNotify message. Also converts values to other types if specified.
             * @param message C2GNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.C2GNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this C2GNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for C2GNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace C2GNotify {

            /** Properties of a C2GNotify. */
            interface $Properties {

                /** C2GNotify senderId */
                senderId?: (number|Long|null);

                /** C2GNotify groupId */
                groupId?: (number|Long|null);

                /** C2GNotify message */
                message?: (im.common.MessageContent.$Properties|null);

                /** C2GNotify name */
                name?: (string|null);

                /** C2GNotify seq */
                seq?: (number|Long|null);

                /** C2GNotify messageId */
                messageId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a C2GNotify. */
            type $Shape = im.group.C2GNotify.$Properties;
        }

        /**
         * Properties of a CreateGroupReq.
         * @deprecated Use im.group.CreateGroupReq.$Properties instead.
         */
        interface ICreateGroupReq extends im.group.CreateGroupReq.$Properties {
        }

        /** Represents a CreateGroupReq. */
        class CreateGroupReq {

            /**
             * Constructs a new CreateGroupReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.CreateGroupReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CreateGroupReq name. */
            name: string;

            /** CreateGroupReq avatar. */
            avatar: string;

            /**
             * Creates a new CreateGroupReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CreateGroupReq instance
             */
            static create(properties: im.group.CreateGroupReq.$Shape): im.group.CreateGroupReq & im.group.CreateGroupReq.$Shape;
            static create(properties?: im.group.CreateGroupReq.$Properties): im.group.CreateGroupReq;

            /**
             * Encodes the specified CreateGroupReq message. Does not implicitly {@link im.group.CreateGroupReq.verify|verify} messages.
             * @param message CreateGroupReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.CreateGroupReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CreateGroupReq message, length delimited. Does not implicitly {@link im.group.CreateGroupReq.verify|verify} messages.
             * @param message CreateGroupReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.CreateGroupReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CreateGroupReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.CreateGroupReq & im.group.CreateGroupReq.$Shape} CreateGroupReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.CreateGroupReq & im.group.CreateGroupReq.$Shape;

            /**
             * Decodes a CreateGroupReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.CreateGroupReq & im.group.CreateGroupReq.$Shape} CreateGroupReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.CreateGroupReq & im.group.CreateGroupReq.$Shape;

            /**
             * Verifies a CreateGroupReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CreateGroupReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CreateGroupReq
             */
            static fromObject(object: { [k: string]: any }): im.group.CreateGroupReq;

            /**
             * Creates a plain object from a CreateGroupReq message. Also converts values to other types if specified.
             * @param message CreateGroupReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.CreateGroupReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CreateGroupReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CreateGroupReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CreateGroupReq {

            /** Properties of a CreateGroupReq. */
            interface $Properties {

                /** CreateGroupReq name */
                name?: (string|null);

                /** CreateGroupReq avatar */
                avatar?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CreateGroupReq. */
            type $Shape = im.group.CreateGroupReq.$Properties;
        }

        /**
         * Properties of a CreateGroupResp.
         * @deprecated Use im.group.CreateGroupResp.$Properties instead.
         */
        interface ICreateGroupResp extends im.group.CreateGroupResp.$Properties {
        }

        /** Represents a CreateGroupResp. */
        class CreateGroupResp {

            /**
             * Constructs a new CreateGroupResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.CreateGroupResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** CreateGroupResp code. */
            code: number;

            /** CreateGroupResp message. */
            message: string;

            /** CreateGroupResp group. */
            group?: (im.group.GroupInfo.$Properties|null);

            /**
             * Creates a new CreateGroupResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CreateGroupResp instance
             */
            static create(properties: im.group.CreateGroupResp.$Shape): im.group.CreateGroupResp & im.group.CreateGroupResp.$Shape;
            static create(properties?: im.group.CreateGroupResp.$Properties): im.group.CreateGroupResp;

            /**
             * Encodes the specified CreateGroupResp message. Does not implicitly {@link im.group.CreateGroupResp.verify|verify} messages.
             * @param message CreateGroupResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.CreateGroupResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CreateGroupResp message, length delimited. Does not implicitly {@link im.group.CreateGroupResp.verify|verify} messages.
             * @param message CreateGroupResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.CreateGroupResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CreateGroupResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.CreateGroupResp & im.group.CreateGroupResp.$Shape} CreateGroupResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.CreateGroupResp & im.group.CreateGroupResp.$Shape;

            /**
             * Decodes a CreateGroupResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.CreateGroupResp & im.group.CreateGroupResp.$Shape} CreateGroupResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.CreateGroupResp & im.group.CreateGroupResp.$Shape;

            /**
             * Verifies a CreateGroupResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CreateGroupResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CreateGroupResp
             */
            static fromObject(object: { [k: string]: any }): im.group.CreateGroupResp;

            /**
             * Creates a plain object from a CreateGroupResp message. Also converts values to other types if specified.
             * @param message CreateGroupResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.CreateGroupResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CreateGroupResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for CreateGroupResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace CreateGroupResp {

            /** Properties of a CreateGroupResp. */
            interface $Properties {

                /** CreateGroupResp code */
                code?: (number|null);

                /** CreateGroupResp message */
                message?: (string|null);

                /** CreateGroupResp group */
                group?: (im.group.GroupInfo.$Properties|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a CreateGroupResp. */
            type $Shape = im.group.CreateGroupResp.$Properties;
        }

        /**
         * Properties of a GroupInfo.
         * @deprecated Use im.group.GroupInfo.$Properties instead.
         */
        interface IGroupInfo extends im.group.GroupInfo.$Properties {
        }

        /** Represents a GroupInfo. */
        class GroupInfo {

            /**
             * Constructs a new GroupInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GroupInfo.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GroupInfo groupId. */
            groupId: (number|Long);

            /** GroupInfo name. */
            name: string;

            /** GroupInfo avatar. */
            avatar: string;

            /** GroupInfo description. */
            description: string;

            /** GroupInfo ownerId. */
            ownerId: (number|Long);

            /** GroupInfo memberCount. */
            memberCount: number;

            /** GroupInfo maxMembers. */
            maxMembers: number;

            /** GroupInfo createdAt. */
            createdAt: (number|Long);

            /**
             * Creates a new GroupInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupInfo instance
             */
            static create(properties: im.group.GroupInfo.$Shape): im.group.GroupInfo & im.group.GroupInfo.$Shape;
            static create(properties?: im.group.GroupInfo.$Properties): im.group.GroupInfo;

            /**
             * Encodes the specified GroupInfo message. Does not implicitly {@link im.group.GroupInfo.verify|verify} messages.
             * @param message GroupInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GroupInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupInfo message, length delimited. Does not implicitly {@link im.group.GroupInfo.verify|verify} messages.
             * @param message GroupInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GroupInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GroupInfo & im.group.GroupInfo.$Shape} GroupInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GroupInfo & im.group.GroupInfo.$Shape;

            /**
             * Decodes a GroupInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GroupInfo & im.group.GroupInfo.$Shape} GroupInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GroupInfo & im.group.GroupInfo.$Shape;

            /**
             * Verifies a GroupInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupInfo
             */
            static fromObject(object: { [k: string]: any }): im.group.GroupInfo;

            /**
             * Creates a plain object from a GroupInfo message. Also converts values to other types if specified.
             * @param message GroupInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GroupInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupInfo to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GroupInfo
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GroupInfo {

            /** Properties of a GroupInfo. */
            interface $Properties {

                /** GroupInfo groupId */
                groupId?: (number|Long|null);

                /** GroupInfo name */
                name?: (string|null);

                /** GroupInfo avatar */
                avatar?: (string|null);

                /** GroupInfo description */
                description?: (string|null);

                /** GroupInfo ownerId */
                ownerId?: (number|Long|null);

                /** GroupInfo memberCount */
                memberCount?: (number|null);

                /** GroupInfo maxMembers */
                maxMembers?: (number|null);

                /** GroupInfo createdAt */
                createdAt?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GroupInfo. */
            type $Shape = im.group.GroupInfo.$Properties;
        }

        /**
         * Properties of an InviteToGroupReq.
         * @deprecated Use im.group.InviteToGroupReq.$Properties instead.
         */
        interface IInviteToGroupReq extends im.group.InviteToGroupReq.$Properties {
        }

        /** Represents an InviteToGroupReq. */
        class InviteToGroupReq {

            /**
             * Constructs a new InviteToGroupReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.InviteToGroupReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** InviteToGroupReq groupId. */
            groupId: (number|Long);

            /** InviteToGroupReq userId. */
            userId: (number|Long);

            /**
             * Creates a new InviteToGroupReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InviteToGroupReq instance
             */
            static create(properties: im.group.InviteToGroupReq.$Shape): im.group.InviteToGroupReq & im.group.InviteToGroupReq.$Shape;
            static create(properties?: im.group.InviteToGroupReq.$Properties): im.group.InviteToGroupReq;

            /**
             * Encodes the specified InviteToGroupReq message. Does not implicitly {@link im.group.InviteToGroupReq.verify|verify} messages.
             * @param message InviteToGroupReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.InviteToGroupReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InviteToGroupReq message, length delimited. Does not implicitly {@link im.group.InviteToGroupReq.verify|verify} messages.
             * @param message InviteToGroupReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.InviteToGroupReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InviteToGroupReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.InviteToGroupReq & im.group.InviteToGroupReq.$Shape} InviteToGroupReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.InviteToGroupReq & im.group.InviteToGroupReq.$Shape;

            /**
             * Decodes an InviteToGroupReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.InviteToGroupReq & im.group.InviteToGroupReq.$Shape} InviteToGroupReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.InviteToGroupReq & im.group.InviteToGroupReq.$Shape;

            /**
             * Verifies an InviteToGroupReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InviteToGroupReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InviteToGroupReq
             */
            static fromObject(object: { [k: string]: any }): im.group.InviteToGroupReq;

            /**
             * Creates a plain object from an InviteToGroupReq message. Also converts values to other types if specified.
             * @param message InviteToGroupReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.InviteToGroupReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InviteToGroupReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InviteToGroupReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InviteToGroupReq {

            /** Properties of an InviteToGroupReq. */
            interface $Properties {

                /** InviteToGroupReq groupId */
                groupId?: (number|Long|null);

                /** InviteToGroupReq userId */
                userId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InviteToGroupReq. */
            type $Shape = im.group.InviteToGroupReq.$Properties;
        }

        /**
         * Properties of an InviteToGroupResp.
         * @deprecated Use im.group.InviteToGroupResp.$Properties instead.
         */
        interface IInviteToGroupResp extends im.group.InviteToGroupResp.$Properties {
        }

        /** Represents an InviteToGroupResp. */
        class InviteToGroupResp {

            /**
             * Constructs a new InviteToGroupResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.InviteToGroupResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** InviteToGroupResp code. */
            code: number;

            /** InviteToGroupResp message. */
            message: string;

            /**
             * Creates a new InviteToGroupResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns InviteToGroupResp instance
             */
            static create(properties: im.group.InviteToGroupResp.$Shape): im.group.InviteToGroupResp & im.group.InviteToGroupResp.$Shape;
            static create(properties?: im.group.InviteToGroupResp.$Properties): im.group.InviteToGroupResp;

            /**
             * Encodes the specified InviteToGroupResp message. Does not implicitly {@link im.group.InviteToGroupResp.verify|verify} messages.
             * @param message InviteToGroupResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.InviteToGroupResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified InviteToGroupResp message, length delimited. Does not implicitly {@link im.group.InviteToGroupResp.verify|verify} messages.
             * @param message InviteToGroupResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.InviteToGroupResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an InviteToGroupResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.InviteToGroupResp & im.group.InviteToGroupResp.$Shape} InviteToGroupResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.InviteToGroupResp & im.group.InviteToGroupResp.$Shape;

            /**
             * Decodes an InviteToGroupResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.InviteToGroupResp & im.group.InviteToGroupResp.$Shape} InviteToGroupResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.InviteToGroupResp & im.group.InviteToGroupResp.$Shape;

            /**
             * Verifies an InviteToGroupResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an InviteToGroupResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns InviteToGroupResp
             */
            static fromObject(object: { [k: string]: any }): im.group.InviteToGroupResp;

            /**
             * Creates a plain object from an InviteToGroupResp message. Also converts values to other types if specified.
             * @param message InviteToGroupResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.InviteToGroupResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this InviteToGroupResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for InviteToGroupResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace InviteToGroupResp {

            /** Properties of an InviteToGroupResp. */
            interface $Properties {

                /** InviteToGroupResp code */
                code?: (number|null);

                /** InviteToGroupResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an InviteToGroupResp. */
            type $Shape = im.group.InviteToGroupResp.$Properties;
        }

        /**
         * Properties of a KickMemberReq.
         * @deprecated Use im.group.KickMemberReq.$Properties instead.
         */
        interface IKickMemberReq extends im.group.KickMemberReq.$Properties {
        }

        /** Represents a KickMemberReq. */
        class KickMemberReq {

            /**
             * Constructs a new KickMemberReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.KickMemberReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** KickMemberReq groupId. */
            groupId: (number|Long);

            /** KickMemberReq userId. */
            userId: (number|Long);

            /**
             * Creates a new KickMemberReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns KickMemberReq instance
             */
            static create(properties: im.group.KickMemberReq.$Shape): im.group.KickMemberReq & im.group.KickMemberReq.$Shape;
            static create(properties?: im.group.KickMemberReq.$Properties): im.group.KickMemberReq;

            /**
             * Encodes the specified KickMemberReq message. Does not implicitly {@link im.group.KickMemberReq.verify|verify} messages.
             * @param message KickMemberReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.KickMemberReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified KickMemberReq message, length delimited. Does not implicitly {@link im.group.KickMemberReq.verify|verify} messages.
             * @param message KickMemberReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.KickMemberReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a KickMemberReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.KickMemberReq & im.group.KickMemberReq.$Shape} KickMemberReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.KickMemberReq & im.group.KickMemberReq.$Shape;

            /**
             * Decodes a KickMemberReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.KickMemberReq & im.group.KickMemberReq.$Shape} KickMemberReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.KickMemberReq & im.group.KickMemberReq.$Shape;

            /**
             * Verifies a KickMemberReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a KickMemberReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns KickMemberReq
             */
            static fromObject(object: { [k: string]: any }): im.group.KickMemberReq;

            /**
             * Creates a plain object from a KickMemberReq message. Also converts values to other types if specified.
             * @param message KickMemberReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.KickMemberReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this KickMemberReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for KickMemberReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace KickMemberReq {

            /** Properties of a KickMemberReq. */
            interface $Properties {

                /** KickMemberReq groupId */
                groupId?: (number|Long|null);

                /** KickMemberReq userId */
                userId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a KickMemberReq. */
            type $Shape = im.group.KickMemberReq.$Properties;
        }

        /**
         * Properties of a KickMemberResp.
         * @deprecated Use im.group.KickMemberResp.$Properties instead.
         */
        interface IKickMemberResp extends im.group.KickMemberResp.$Properties {
        }

        /** Represents a KickMemberResp. */
        class KickMemberResp {

            /**
             * Constructs a new KickMemberResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.KickMemberResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** KickMemberResp code. */
            code: number;

            /** KickMemberResp message. */
            message: string;

            /**
             * Creates a new KickMemberResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns KickMemberResp instance
             */
            static create(properties: im.group.KickMemberResp.$Shape): im.group.KickMemberResp & im.group.KickMemberResp.$Shape;
            static create(properties?: im.group.KickMemberResp.$Properties): im.group.KickMemberResp;

            /**
             * Encodes the specified KickMemberResp message. Does not implicitly {@link im.group.KickMemberResp.verify|verify} messages.
             * @param message KickMemberResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.KickMemberResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified KickMemberResp message, length delimited. Does not implicitly {@link im.group.KickMemberResp.verify|verify} messages.
             * @param message KickMemberResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.KickMemberResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a KickMemberResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.KickMemberResp & im.group.KickMemberResp.$Shape} KickMemberResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.KickMemberResp & im.group.KickMemberResp.$Shape;

            /**
             * Decodes a KickMemberResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.KickMemberResp & im.group.KickMemberResp.$Shape} KickMemberResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.KickMemberResp & im.group.KickMemberResp.$Shape;

            /**
             * Verifies a KickMemberResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a KickMemberResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns KickMemberResp
             */
            static fromObject(object: { [k: string]: any }): im.group.KickMemberResp;

            /**
             * Creates a plain object from a KickMemberResp message. Also converts values to other types if specified.
             * @param message KickMemberResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.KickMemberResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this KickMemberResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for KickMemberResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace KickMemberResp {

            /** Properties of a KickMemberResp. */
            interface $Properties {

                /** KickMemberResp code */
                code?: (number|null);

                /** KickMemberResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a KickMemberResp. */
            type $Shape = im.group.KickMemberResp.$Properties;
        }

        /**
         * Properties of a GetGroupInfoReq.
         * @deprecated Use im.group.GetGroupInfoReq.$Properties instead.
         */
        interface IGetGroupInfoReq extends im.group.GetGroupInfoReq.$Properties {
        }

        /** Represents a GetGroupInfoReq. */
        class GetGroupInfoReq {

            /**
             * Constructs a new GetGroupInfoReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupInfoReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupInfoReq groupId. */
            groupId: (number|Long);

            /**
             * Creates a new GetGroupInfoReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupInfoReq instance
             */
            static create(properties: im.group.GetGroupInfoReq.$Shape): im.group.GetGroupInfoReq & im.group.GetGroupInfoReq.$Shape;
            static create(properties?: im.group.GetGroupInfoReq.$Properties): im.group.GetGroupInfoReq;

            /**
             * Encodes the specified GetGroupInfoReq message. Does not implicitly {@link im.group.GetGroupInfoReq.verify|verify} messages.
             * @param message GetGroupInfoReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupInfoReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupInfoReq message, length delimited. Does not implicitly {@link im.group.GetGroupInfoReq.verify|verify} messages.
             * @param message GetGroupInfoReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupInfoReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupInfoReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupInfoReq & im.group.GetGroupInfoReq.$Shape} GetGroupInfoReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupInfoReq & im.group.GetGroupInfoReq.$Shape;

            /**
             * Decodes a GetGroupInfoReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupInfoReq & im.group.GetGroupInfoReq.$Shape} GetGroupInfoReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupInfoReq & im.group.GetGroupInfoReq.$Shape;

            /**
             * Verifies a GetGroupInfoReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupInfoReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupInfoReq
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupInfoReq;

            /**
             * Creates a plain object from a GetGroupInfoReq message. Also converts values to other types if specified.
             * @param message GetGroupInfoReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupInfoReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupInfoReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupInfoReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupInfoReq {

            /** Properties of a GetGroupInfoReq. */
            interface $Properties {

                /** GetGroupInfoReq groupId */
                groupId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupInfoReq. */
            type $Shape = im.group.GetGroupInfoReq.$Properties;
        }

        /**
         * Properties of a GetGroupInfoResp.
         * @deprecated Use im.group.GetGroupInfoResp.$Properties instead.
         */
        interface IGetGroupInfoResp extends im.group.GetGroupInfoResp.$Properties {
        }

        /** Represents a GetGroupInfoResp. */
        class GetGroupInfoResp {

            /**
             * Constructs a new GetGroupInfoResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupInfoResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupInfoResp code. */
            code: number;

            /** GetGroupInfoResp message. */
            message: string;

            /** GetGroupInfoResp group. */
            group?: (im.group.GroupInfo.$Properties|null);

            /**
             * Creates a new GetGroupInfoResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupInfoResp instance
             */
            static create(properties: im.group.GetGroupInfoResp.$Shape): im.group.GetGroupInfoResp & im.group.GetGroupInfoResp.$Shape;
            static create(properties?: im.group.GetGroupInfoResp.$Properties): im.group.GetGroupInfoResp;

            /**
             * Encodes the specified GetGroupInfoResp message. Does not implicitly {@link im.group.GetGroupInfoResp.verify|verify} messages.
             * @param message GetGroupInfoResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupInfoResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupInfoResp message, length delimited. Does not implicitly {@link im.group.GetGroupInfoResp.verify|verify} messages.
             * @param message GetGroupInfoResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupInfoResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupInfoResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupInfoResp & im.group.GetGroupInfoResp.$Shape} GetGroupInfoResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupInfoResp & im.group.GetGroupInfoResp.$Shape;

            /**
             * Decodes a GetGroupInfoResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupInfoResp & im.group.GetGroupInfoResp.$Shape} GetGroupInfoResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupInfoResp & im.group.GetGroupInfoResp.$Shape;

            /**
             * Verifies a GetGroupInfoResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupInfoResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupInfoResp
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupInfoResp;

            /**
             * Creates a plain object from a GetGroupInfoResp message. Also converts values to other types if specified.
             * @param message GetGroupInfoResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupInfoResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupInfoResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupInfoResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupInfoResp {

            /** Properties of a GetGroupInfoResp. */
            interface $Properties {

                /** GetGroupInfoResp code */
                code?: (number|null);

                /** GetGroupInfoResp message */
                message?: (string|null);

                /** GetGroupInfoResp group */
                group?: (im.group.GroupInfo.$Properties|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupInfoResp. */
            type $Shape = im.group.GetGroupInfoResp.$Properties;
        }

        /**
         * Properties of a GetGroupMembersReq.
         * @deprecated Use im.group.GetGroupMembersReq.$Properties instead.
         */
        interface IGetGroupMembersReq extends im.group.GetGroupMembersReq.$Properties {
        }

        /** Represents a GetGroupMembersReq. */
        class GetGroupMembersReq {

            /**
             * Constructs a new GetGroupMembersReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupMembersReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupMembersReq groupId. */
            groupId: (number|Long);

            /**
             * Creates a new GetGroupMembersReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupMembersReq instance
             */
            static create(properties: im.group.GetGroupMembersReq.$Shape): im.group.GetGroupMembersReq & im.group.GetGroupMembersReq.$Shape;
            static create(properties?: im.group.GetGroupMembersReq.$Properties): im.group.GetGroupMembersReq;

            /**
             * Encodes the specified GetGroupMembersReq message. Does not implicitly {@link im.group.GetGroupMembersReq.verify|verify} messages.
             * @param message GetGroupMembersReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupMembersReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupMembersReq message, length delimited. Does not implicitly {@link im.group.GetGroupMembersReq.verify|verify} messages.
             * @param message GetGroupMembersReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupMembersReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupMembersReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupMembersReq & im.group.GetGroupMembersReq.$Shape} GetGroupMembersReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupMembersReq & im.group.GetGroupMembersReq.$Shape;

            /**
             * Decodes a GetGroupMembersReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupMembersReq & im.group.GetGroupMembersReq.$Shape} GetGroupMembersReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupMembersReq & im.group.GetGroupMembersReq.$Shape;

            /**
             * Verifies a GetGroupMembersReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupMembersReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupMembersReq
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupMembersReq;

            /**
             * Creates a plain object from a GetGroupMembersReq message. Also converts values to other types if specified.
             * @param message GetGroupMembersReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupMembersReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupMembersReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupMembersReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupMembersReq {

            /** Properties of a GetGroupMembersReq. */
            interface $Properties {

                /** GetGroupMembersReq groupId */
                groupId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupMembersReq. */
            type $Shape = im.group.GetGroupMembersReq.$Properties;
        }

        /**
         * Properties of a GroupMember.
         * @deprecated Use im.group.GroupMember.$Properties instead.
         */
        interface IGroupMember extends im.group.GroupMember.$Properties {
        }

        /** Represents a GroupMember. */
        class GroupMember {

            /**
             * Constructs a new GroupMember.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GroupMember.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GroupMember userId. */
            userId: (number|Long);

            /** GroupMember userName. */
            userName: string;

            /** GroupMember nickname. */
            nickname: string;

            /** GroupMember avatar. */
            avatar: string;

            /** GroupMember role. */
            role: number;

            /** GroupMember joinedAt. */
            joinedAt: (number|Long);

            /**
             * Creates a new GroupMember instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupMember instance
             */
            static create(properties: im.group.GroupMember.$Shape): im.group.GroupMember & im.group.GroupMember.$Shape;
            static create(properties?: im.group.GroupMember.$Properties): im.group.GroupMember;

            /**
             * Encodes the specified GroupMember message. Does not implicitly {@link im.group.GroupMember.verify|verify} messages.
             * @param message GroupMember message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GroupMember.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupMember message, length delimited. Does not implicitly {@link im.group.GroupMember.verify|verify} messages.
             * @param message GroupMember message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GroupMember.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupMember message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GroupMember & im.group.GroupMember.$Shape} GroupMember
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GroupMember & im.group.GroupMember.$Shape;

            /**
             * Decodes a GroupMember message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GroupMember & im.group.GroupMember.$Shape} GroupMember
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GroupMember & im.group.GroupMember.$Shape;

            /**
             * Verifies a GroupMember message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupMember message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupMember
             */
            static fromObject(object: { [k: string]: any }): im.group.GroupMember;

            /**
             * Creates a plain object from a GroupMember message. Also converts values to other types if specified.
             * @param message GroupMember
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GroupMember, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupMember to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GroupMember
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GroupMember {

            /** Properties of a GroupMember. */
            interface $Properties {

                /** GroupMember userId */
                userId?: (number|Long|null);

                /** GroupMember userName */
                userName?: (string|null);

                /** GroupMember nickname */
                nickname?: (string|null);

                /** GroupMember avatar */
                avatar?: (string|null);

                /** GroupMember role */
                role?: (number|null);

                /** GroupMember joinedAt */
                joinedAt?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GroupMember. */
            type $Shape = im.group.GroupMember.$Properties;
        }

        /**
         * Properties of a GetGroupMembersResp.
         * @deprecated Use im.group.GetGroupMembersResp.$Properties instead.
         */
        interface IGetGroupMembersResp extends im.group.GetGroupMembersResp.$Properties {
        }

        /** Represents a GetGroupMembersResp. */
        class GetGroupMembersResp {

            /**
             * Constructs a new GetGroupMembersResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupMembersResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupMembersResp code. */
            code: number;

            /** GetGroupMembersResp message. */
            message: string;

            /** GetGroupMembersResp members. */
            members: im.group.GroupMember.$Properties[];

            /**
             * Creates a new GetGroupMembersResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupMembersResp instance
             */
            static create(properties: im.group.GetGroupMembersResp.$Shape): im.group.GetGroupMembersResp & im.group.GetGroupMembersResp.$Shape;
            static create(properties?: im.group.GetGroupMembersResp.$Properties): im.group.GetGroupMembersResp;

            /**
             * Encodes the specified GetGroupMembersResp message. Does not implicitly {@link im.group.GetGroupMembersResp.verify|verify} messages.
             * @param message GetGroupMembersResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupMembersResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupMembersResp message, length delimited. Does not implicitly {@link im.group.GetGroupMembersResp.verify|verify} messages.
             * @param message GetGroupMembersResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupMembersResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupMembersResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupMembersResp & im.group.GetGroupMembersResp.$Shape} GetGroupMembersResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupMembersResp & im.group.GetGroupMembersResp.$Shape;

            /**
             * Decodes a GetGroupMembersResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupMembersResp & im.group.GetGroupMembersResp.$Shape} GetGroupMembersResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupMembersResp & im.group.GetGroupMembersResp.$Shape;

            /**
             * Verifies a GetGroupMembersResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupMembersResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupMembersResp
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupMembersResp;

            /**
             * Creates a plain object from a GetGroupMembersResp message. Also converts values to other types if specified.
             * @param message GetGroupMembersResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupMembersResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupMembersResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupMembersResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupMembersResp {

            /** Properties of a GetGroupMembersResp. */
            interface $Properties {

                /** GetGroupMembersResp code */
                code?: (number|null);

                /** GetGroupMembersResp message */
                message?: (string|null);

                /** GetGroupMembersResp members */
                members?: (im.group.GroupMember.$Properties[]|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupMembersResp. */
            type $Shape = im.group.GetGroupMembersResp.$Properties;
        }

        /**
         * Properties of a GetMyGroupsReq.
         * @deprecated Use im.group.GetMyGroupsReq.$Properties instead.
         */
        interface IGetMyGroupsReq extends im.group.GetMyGroupsReq.$Properties {
        }

        /** Represents a GetMyGroupsReq. */
        class GetMyGroupsReq {

            /**
             * Constructs a new GetMyGroupsReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetMyGroupsReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /**
             * Creates a new GetMyGroupsReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetMyGroupsReq instance
             */
            static create(properties: im.group.GetMyGroupsReq.$Shape): im.group.GetMyGroupsReq & im.group.GetMyGroupsReq.$Shape;
            static create(properties?: im.group.GetMyGroupsReq.$Properties): im.group.GetMyGroupsReq;

            /**
             * Encodes the specified GetMyGroupsReq message. Does not implicitly {@link im.group.GetMyGroupsReq.verify|verify} messages.
             * @param message GetMyGroupsReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetMyGroupsReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetMyGroupsReq message, length delimited. Does not implicitly {@link im.group.GetMyGroupsReq.verify|verify} messages.
             * @param message GetMyGroupsReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetMyGroupsReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetMyGroupsReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetMyGroupsReq & im.group.GetMyGroupsReq.$Shape} GetMyGroupsReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetMyGroupsReq & im.group.GetMyGroupsReq.$Shape;

            /**
             * Decodes a GetMyGroupsReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetMyGroupsReq & im.group.GetMyGroupsReq.$Shape} GetMyGroupsReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetMyGroupsReq & im.group.GetMyGroupsReq.$Shape;

            /**
             * Verifies a GetMyGroupsReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetMyGroupsReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetMyGroupsReq
             */
            static fromObject(object: { [k: string]: any }): im.group.GetMyGroupsReq;

            /**
             * Creates a plain object from a GetMyGroupsReq message. Also converts values to other types if specified.
             * @param message GetMyGroupsReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetMyGroupsReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetMyGroupsReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetMyGroupsReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetMyGroupsReq {

            /** Properties of a GetMyGroupsReq. */
            interface $Properties {

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetMyGroupsReq. */
            type $Shape = im.group.GetMyGroupsReq.$Properties;
        }

        /**
         * Properties of a GetMyGroupsResp.
         * @deprecated Use im.group.GetMyGroupsResp.$Properties instead.
         */
        interface IGetMyGroupsResp extends im.group.GetMyGroupsResp.$Properties {
        }

        /** Represents a GetMyGroupsResp. */
        class GetMyGroupsResp {

            /**
             * Constructs a new GetMyGroupsResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetMyGroupsResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetMyGroupsResp code. */
            code: number;

            /** GetMyGroupsResp message. */
            message: string;

            /** GetMyGroupsResp groups. */
            groups: im.group.GroupInfo.$Properties[];

            /**
             * Creates a new GetMyGroupsResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetMyGroupsResp instance
             */
            static create(properties: im.group.GetMyGroupsResp.$Shape): im.group.GetMyGroupsResp & im.group.GetMyGroupsResp.$Shape;
            static create(properties?: im.group.GetMyGroupsResp.$Properties): im.group.GetMyGroupsResp;

            /**
             * Encodes the specified GetMyGroupsResp message. Does not implicitly {@link im.group.GetMyGroupsResp.verify|verify} messages.
             * @param message GetMyGroupsResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetMyGroupsResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetMyGroupsResp message, length delimited. Does not implicitly {@link im.group.GetMyGroupsResp.verify|verify} messages.
             * @param message GetMyGroupsResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetMyGroupsResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetMyGroupsResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetMyGroupsResp & im.group.GetMyGroupsResp.$Shape} GetMyGroupsResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetMyGroupsResp & im.group.GetMyGroupsResp.$Shape;

            /**
             * Decodes a GetMyGroupsResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetMyGroupsResp & im.group.GetMyGroupsResp.$Shape} GetMyGroupsResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetMyGroupsResp & im.group.GetMyGroupsResp.$Shape;

            /**
             * Verifies a GetMyGroupsResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetMyGroupsResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetMyGroupsResp
             */
            static fromObject(object: { [k: string]: any }): im.group.GetMyGroupsResp;

            /**
             * Creates a plain object from a GetMyGroupsResp message. Also converts values to other types if specified.
             * @param message GetMyGroupsResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetMyGroupsResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetMyGroupsResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetMyGroupsResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetMyGroupsResp {

            /** Properties of a GetMyGroupsResp. */
            interface $Properties {

                /** GetMyGroupsResp code */
                code?: (number|null);

                /** GetMyGroupsResp message */
                message?: (string|null);

                /** GetMyGroupsResp groups */
                groups?: (im.group.GroupInfo.$Properties[]|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetMyGroupsResp. */
            type $Shape = im.group.GetMyGroupsResp.$Properties;
        }

        /**
         * Properties of a GroupMemberChangeNotify.
         * @deprecated Use im.group.GroupMemberChangeNotify.$Properties instead.
         */
        interface IGroupMemberChangeNotify extends im.group.GroupMemberChangeNotify.$Properties {
        }

        /** Represents a GroupMemberChangeNotify. */
        class GroupMemberChangeNotify {

            /**
             * Constructs a new GroupMemberChangeNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GroupMemberChangeNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GroupMemberChangeNotify groupId. */
            groupId: (number|Long);

            /** GroupMemberChangeNotify type. */
            type: im.group.GroupMemberChangeNotify.ChangeType;

            /** GroupMemberChangeNotify userId. */
            userId: (number|Long);

            /** GroupMemberChangeNotify operatorId. */
            operatorId: (number|Long);

            /** GroupMemberChangeNotify userName. */
            userName: string;

            /** GroupMemberChangeNotify nickname. */
            nickname: string;

            /**
             * Creates a new GroupMemberChangeNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupMemberChangeNotify instance
             */
            static create(properties: im.group.GroupMemberChangeNotify.$Shape): im.group.GroupMemberChangeNotify & im.group.GroupMemberChangeNotify.$Shape;
            static create(properties?: im.group.GroupMemberChangeNotify.$Properties): im.group.GroupMemberChangeNotify;

            /**
             * Encodes the specified GroupMemberChangeNotify message. Does not implicitly {@link im.group.GroupMemberChangeNotify.verify|verify} messages.
             * @param message GroupMemberChangeNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GroupMemberChangeNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupMemberChangeNotify message, length delimited. Does not implicitly {@link im.group.GroupMemberChangeNotify.verify|verify} messages.
             * @param message GroupMemberChangeNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GroupMemberChangeNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupMemberChangeNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GroupMemberChangeNotify & im.group.GroupMemberChangeNotify.$Shape} GroupMemberChangeNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GroupMemberChangeNotify & im.group.GroupMemberChangeNotify.$Shape;

            /**
             * Decodes a GroupMemberChangeNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GroupMemberChangeNotify & im.group.GroupMemberChangeNotify.$Shape} GroupMemberChangeNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GroupMemberChangeNotify & im.group.GroupMemberChangeNotify.$Shape;

            /**
             * Verifies a GroupMemberChangeNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupMemberChangeNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupMemberChangeNotify
             */
            static fromObject(object: { [k: string]: any }): im.group.GroupMemberChangeNotify;

            /**
             * Creates a plain object from a GroupMemberChangeNotify message. Also converts values to other types if specified.
             * @param message GroupMemberChangeNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GroupMemberChangeNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupMemberChangeNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GroupMemberChangeNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GroupMemberChangeNotify {

            /** Properties of a GroupMemberChangeNotify. */
            interface $Properties {

                /** GroupMemberChangeNotify groupId */
                groupId?: (number|Long|null);

                /** GroupMemberChangeNotify type */
                type?: (im.group.GroupMemberChangeNotify.ChangeType|null);

                /** GroupMemberChangeNotify userId */
                userId?: (number|Long|null);

                /** GroupMemberChangeNotify operatorId */
                operatorId?: (number|Long|null);

                /** GroupMemberChangeNotify userName */
                userName?: (string|null);

                /** GroupMemberChangeNotify nickname */
                nickname?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GroupMemberChangeNotify. */
            type $Shape = im.group.GroupMemberChangeNotify.$Properties;

            /** ChangeType enum. */
            enum ChangeType {

                /** INVITED value */
                INVITED = 0,

                /** JOINED value */
                JOINED = 1,

                /** LEFT value */
                LEFT = 2,

                /** KICKED value */
                KICKED = 3,

                /** ADMIN_SET value */
                ADMIN_SET = 4,

                /** OWNER_TRANSFERRED value */
                OWNER_TRANSFERRED = 5
            }
        }

        /**
         * Properties of a GroupAckReq.
         * @deprecated Use im.group.GroupAckReq.$Properties instead.
         */
        interface IGroupAckReq extends im.group.GroupAckReq.$Properties {
        }

        /** Represents a GroupAckReq. */
        class GroupAckReq {

            /**
             * Constructs a new GroupAckReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GroupAckReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GroupAckReq groupId. */
            groupId: (number|Long);

            /** GroupAckReq lastReadSeq. */
            lastReadSeq: (number|Long);

            /**
             * Creates a new GroupAckReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupAckReq instance
             */
            static create(properties: im.group.GroupAckReq.$Shape): im.group.GroupAckReq & im.group.GroupAckReq.$Shape;
            static create(properties?: im.group.GroupAckReq.$Properties): im.group.GroupAckReq;

            /**
             * Encodes the specified GroupAckReq message. Does not implicitly {@link im.group.GroupAckReq.verify|verify} messages.
             * @param message GroupAckReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GroupAckReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupAckReq message, length delimited. Does not implicitly {@link im.group.GroupAckReq.verify|verify} messages.
             * @param message GroupAckReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GroupAckReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupAckReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GroupAckReq & im.group.GroupAckReq.$Shape} GroupAckReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GroupAckReq & im.group.GroupAckReq.$Shape;

            /**
             * Decodes a GroupAckReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GroupAckReq & im.group.GroupAckReq.$Shape} GroupAckReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GroupAckReq & im.group.GroupAckReq.$Shape;

            /**
             * Verifies a GroupAckReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupAckReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupAckReq
             */
            static fromObject(object: { [k: string]: any }): im.group.GroupAckReq;

            /**
             * Creates a plain object from a GroupAckReq message. Also converts values to other types if specified.
             * @param message GroupAckReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GroupAckReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupAckReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GroupAckReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GroupAckReq {

            /** Properties of a GroupAckReq. */
            interface $Properties {

                /** GroupAckReq groupId */
                groupId?: (number|Long|null);

                /** GroupAckReq lastReadSeq */
                lastReadSeq?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GroupAckReq. */
            type $Shape = im.group.GroupAckReq.$Properties;
        }

        /**
         * Properties of a GroupAckResp.
         * @deprecated Use im.group.GroupAckResp.$Properties instead.
         */
        interface IGroupAckResp extends im.group.GroupAckResp.$Properties {
        }

        /** Represents a GroupAckResp. */
        class GroupAckResp {

            /**
             * Constructs a new GroupAckResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GroupAckResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GroupAckResp code. */
            code: number;

            /** GroupAckResp message. */
            message: string;

            /**
             * Creates a new GroupAckResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupAckResp instance
             */
            static create(properties: im.group.GroupAckResp.$Shape): im.group.GroupAckResp & im.group.GroupAckResp.$Shape;
            static create(properties?: im.group.GroupAckResp.$Properties): im.group.GroupAckResp;

            /**
             * Encodes the specified GroupAckResp message. Does not implicitly {@link im.group.GroupAckResp.verify|verify} messages.
             * @param message GroupAckResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GroupAckResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupAckResp message, length delimited. Does not implicitly {@link im.group.GroupAckResp.verify|verify} messages.
             * @param message GroupAckResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GroupAckResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupAckResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GroupAckResp & im.group.GroupAckResp.$Shape} GroupAckResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GroupAckResp & im.group.GroupAckResp.$Shape;

            /**
             * Decodes a GroupAckResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GroupAckResp & im.group.GroupAckResp.$Shape} GroupAckResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GroupAckResp & im.group.GroupAckResp.$Shape;

            /**
             * Verifies a GroupAckResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupAckResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupAckResp
             */
            static fromObject(object: { [k: string]: any }): im.group.GroupAckResp;

            /**
             * Creates a plain object from a GroupAckResp message. Also converts values to other types if specified.
             * @param message GroupAckResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GroupAckResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupAckResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GroupAckResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GroupAckResp {

            /** Properties of a GroupAckResp. */
            interface $Properties {

                /** GroupAckResp code */
                code?: (number|null);

                /** GroupAckResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GroupAckResp. */
            type $Shape = im.group.GroupAckResp.$Properties;
        }

        /**
         * Properties of a GetGroupMsgReadStatusReq.
         * @deprecated Use im.group.GetGroupMsgReadStatusReq.$Properties instead.
         */
        interface IGetGroupMsgReadStatusReq extends im.group.GetGroupMsgReadStatusReq.$Properties {
        }

        /** Represents a GetGroupMsgReadStatusReq. */
        class GetGroupMsgReadStatusReq {

            /**
             * Constructs a new GetGroupMsgReadStatusReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupMsgReadStatusReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupMsgReadStatusReq groupId. */
            groupId: (number|Long);

            /** GetGroupMsgReadStatusReq seq. */
            seq: (number|Long);

            /**
             * Creates a new GetGroupMsgReadStatusReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupMsgReadStatusReq instance
             */
            static create(properties: im.group.GetGroupMsgReadStatusReq.$Shape): im.group.GetGroupMsgReadStatusReq & im.group.GetGroupMsgReadStatusReq.$Shape;
            static create(properties?: im.group.GetGroupMsgReadStatusReq.$Properties): im.group.GetGroupMsgReadStatusReq;

            /**
             * Encodes the specified GetGroupMsgReadStatusReq message. Does not implicitly {@link im.group.GetGroupMsgReadStatusReq.verify|verify} messages.
             * @param message GetGroupMsgReadStatusReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupMsgReadStatusReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupMsgReadStatusReq message, length delimited. Does not implicitly {@link im.group.GetGroupMsgReadStatusReq.verify|verify} messages.
             * @param message GetGroupMsgReadStatusReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupMsgReadStatusReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupMsgReadStatusReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupMsgReadStatusReq & im.group.GetGroupMsgReadStatusReq.$Shape} GetGroupMsgReadStatusReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupMsgReadStatusReq & im.group.GetGroupMsgReadStatusReq.$Shape;

            /**
             * Decodes a GetGroupMsgReadStatusReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupMsgReadStatusReq & im.group.GetGroupMsgReadStatusReq.$Shape} GetGroupMsgReadStatusReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupMsgReadStatusReq & im.group.GetGroupMsgReadStatusReq.$Shape;

            /**
             * Verifies a GetGroupMsgReadStatusReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupMsgReadStatusReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupMsgReadStatusReq
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupMsgReadStatusReq;

            /**
             * Creates a plain object from a GetGroupMsgReadStatusReq message. Also converts values to other types if specified.
             * @param message GetGroupMsgReadStatusReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupMsgReadStatusReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupMsgReadStatusReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupMsgReadStatusReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupMsgReadStatusReq {

            /** Properties of a GetGroupMsgReadStatusReq. */
            interface $Properties {

                /** GetGroupMsgReadStatusReq groupId */
                groupId?: (number|Long|null);

                /** GetGroupMsgReadStatusReq seq */
                seq?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupMsgReadStatusReq. */
            type $Shape = im.group.GetGroupMsgReadStatusReq.$Properties;
        }

        /**
         * Properties of a GroupMsgReader.
         * @deprecated Use im.group.GroupMsgReader.$Properties instead.
         */
        interface IGroupMsgReader extends im.group.GroupMsgReader.$Properties {
        }

        /** Represents a GroupMsgReader. */
        class GroupMsgReader {

            /**
             * Constructs a new GroupMsgReader.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GroupMsgReader.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GroupMsgReader userId. */
            userId: (number|Long);

            /** GroupMsgReader nickname. */
            nickname: string;

            /** GroupMsgReader avatar. */
            avatar: string;

            /**
             * Creates a new GroupMsgReader instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupMsgReader instance
             */
            static create(properties: im.group.GroupMsgReader.$Shape): im.group.GroupMsgReader & im.group.GroupMsgReader.$Shape;
            static create(properties?: im.group.GroupMsgReader.$Properties): im.group.GroupMsgReader;

            /**
             * Encodes the specified GroupMsgReader message. Does not implicitly {@link im.group.GroupMsgReader.verify|verify} messages.
             * @param message GroupMsgReader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GroupMsgReader.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupMsgReader message, length delimited. Does not implicitly {@link im.group.GroupMsgReader.verify|verify} messages.
             * @param message GroupMsgReader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GroupMsgReader.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupMsgReader message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GroupMsgReader & im.group.GroupMsgReader.$Shape} GroupMsgReader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GroupMsgReader & im.group.GroupMsgReader.$Shape;

            /**
             * Decodes a GroupMsgReader message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GroupMsgReader & im.group.GroupMsgReader.$Shape} GroupMsgReader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GroupMsgReader & im.group.GroupMsgReader.$Shape;

            /**
             * Verifies a GroupMsgReader message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupMsgReader message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupMsgReader
             */
            static fromObject(object: { [k: string]: any }): im.group.GroupMsgReader;

            /**
             * Creates a plain object from a GroupMsgReader message. Also converts values to other types if specified.
             * @param message GroupMsgReader
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GroupMsgReader, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupMsgReader to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GroupMsgReader
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GroupMsgReader {

            /** Properties of a GroupMsgReader. */
            interface $Properties {

                /** GroupMsgReader userId */
                userId?: (number|Long|null);

                /** GroupMsgReader nickname */
                nickname?: (string|null);

                /** GroupMsgReader avatar */
                avatar?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GroupMsgReader. */
            type $Shape = im.group.GroupMsgReader.$Properties;
        }

        /**
         * Properties of a GetGroupMsgReadStatusResp.
         * @deprecated Use im.group.GetGroupMsgReadStatusResp.$Properties instead.
         */
        interface IGetGroupMsgReadStatusResp extends im.group.GetGroupMsgReadStatusResp.$Properties {
        }

        /** Represents a GetGroupMsgReadStatusResp. */
        class GetGroupMsgReadStatusResp {

            /**
             * Constructs a new GetGroupMsgReadStatusResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupMsgReadStatusResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupMsgReadStatusResp code. */
            code: number;

            /** GetGroupMsgReadStatusResp message. */
            message: string;

            /** GetGroupMsgReadStatusResp readers. */
            readers: im.group.GroupMsgReader.$Properties[];

            /**
             * Creates a new GetGroupMsgReadStatusResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupMsgReadStatusResp instance
             */
            static create(properties: im.group.GetGroupMsgReadStatusResp.$Shape): im.group.GetGroupMsgReadStatusResp & im.group.GetGroupMsgReadStatusResp.$Shape;
            static create(properties?: im.group.GetGroupMsgReadStatusResp.$Properties): im.group.GetGroupMsgReadStatusResp;

            /**
             * Encodes the specified GetGroupMsgReadStatusResp message. Does not implicitly {@link im.group.GetGroupMsgReadStatusResp.verify|verify} messages.
             * @param message GetGroupMsgReadStatusResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupMsgReadStatusResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupMsgReadStatusResp message, length delimited. Does not implicitly {@link im.group.GetGroupMsgReadStatusResp.verify|verify} messages.
             * @param message GetGroupMsgReadStatusResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupMsgReadStatusResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupMsgReadStatusResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupMsgReadStatusResp & im.group.GetGroupMsgReadStatusResp.$Shape} GetGroupMsgReadStatusResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupMsgReadStatusResp & im.group.GetGroupMsgReadStatusResp.$Shape;

            /**
             * Decodes a GetGroupMsgReadStatusResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupMsgReadStatusResp & im.group.GetGroupMsgReadStatusResp.$Shape} GetGroupMsgReadStatusResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupMsgReadStatusResp & im.group.GetGroupMsgReadStatusResp.$Shape;

            /**
             * Verifies a GetGroupMsgReadStatusResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupMsgReadStatusResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupMsgReadStatusResp
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupMsgReadStatusResp;

            /**
             * Creates a plain object from a GetGroupMsgReadStatusResp message. Also converts values to other types if specified.
             * @param message GetGroupMsgReadStatusResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupMsgReadStatusResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupMsgReadStatusResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupMsgReadStatusResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupMsgReadStatusResp {

            /** Properties of a GetGroupMsgReadStatusResp. */
            interface $Properties {

                /** GetGroupMsgReadStatusResp code */
                code?: (number|null);

                /** GetGroupMsgReadStatusResp message */
                message?: (string|null);

                /** GetGroupMsgReadStatusResp readers */
                readers?: (im.group.GroupMsgReader.$Properties[]|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupMsgReadStatusResp. */
            type $Shape = im.group.GetGroupMsgReadStatusResp.$Properties;
        }

        /**
         * Properties of a GetGroupReadStateReq.
         * @deprecated Use im.group.GetGroupReadStateReq.$Properties instead.
         */
        interface IGetGroupReadStateReq extends im.group.GetGroupReadStateReq.$Properties {
        }

        /** Represents a GetGroupReadStateReq. */
        class GetGroupReadStateReq {

            /**
             * Constructs a new GetGroupReadStateReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupReadStateReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupReadStateReq groupId. */
            groupId: (number|Long);

            /**
             * Creates a new GetGroupReadStateReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupReadStateReq instance
             */
            static create(properties: im.group.GetGroupReadStateReq.$Shape): im.group.GetGroupReadStateReq & im.group.GetGroupReadStateReq.$Shape;
            static create(properties?: im.group.GetGroupReadStateReq.$Properties): im.group.GetGroupReadStateReq;

            /**
             * Encodes the specified GetGroupReadStateReq message. Does not implicitly {@link im.group.GetGroupReadStateReq.verify|verify} messages.
             * @param message GetGroupReadStateReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupReadStateReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupReadStateReq message, length delimited. Does not implicitly {@link im.group.GetGroupReadStateReq.verify|verify} messages.
             * @param message GetGroupReadStateReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupReadStateReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupReadStateReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupReadStateReq & im.group.GetGroupReadStateReq.$Shape} GetGroupReadStateReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupReadStateReq & im.group.GetGroupReadStateReq.$Shape;

            /**
             * Decodes a GetGroupReadStateReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupReadStateReq & im.group.GetGroupReadStateReq.$Shape} GetGroupReadStateReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupReadStateReq & im.group.GetGroupReadStateReq.$Shape;

            /**
             * Verifies a GetGroupReadStateReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupReadStateReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupReadStateReq
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupReadStateReq;

            /**
             * Creates a plain object from a GetGroupReadStateReq message. Also converts values to other types if specified.
             * @param message GetGroupReadStateReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupReadStateReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupReadStateReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupReadStateReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupReadStateReq {

            /** Properties of a GetGroupReadStateReq. */
            interface $Properties {

                /** GetGroupReadStateReq groupId */
                groupId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupReadStateReq. */
            type $Shape = im.group.GetGroupReadStateReq.$Properties;
        }

        /**
         * Properties of a MemberReadState.
         * @deprecated Use im.group.MemberReadState.$Properties instead.
         */
        interface IMemberReadState extends im.group.MemberReadState.$Properties {
        }

        /** Represents a MemberReadState. */
        class MemberReadState {

            /**
             * Constructs a new MemberReadState.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.MemberReadState.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** MemberReadState userId. */
            userId: (number|Long);

            /** MemberReadState lastReadSeq. */
            lastReadSeq: (number|Long);

            /**
             * Creates a new MemberReadState instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MemberReadState instance
             */
            static create(properties: im.group.MemberReadState.$Shape): im.group.MemberReadState & im.group.MemberReadState.$Shape;
            static create(properties?: im.group.MemberReadState.$Properties): im.group.MemberReadState;

            /**
             * Encodes the specified MemberReadState message. Does not implicitly {@link im.group.MemberReadState.verify|verify} messages.
             * @param message MemberReadState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.MemberReadState.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MemberReadState message, length delimited. Does not implicitly {@link im.group.MemberReadState.verify|verify} messages.
             * @param message MemberReadState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.MemberReadState.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MemberReadState message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.MemberReadState & im.group.MemberReadState.$Shape} MemberReadState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.MemberReadState & im.group.MemberReadState.$Shape;

            /**
             * Decodes a MemberReadState message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.MemberReadState & im.group.MemberReadState.$Shape} MemberReadState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.MemberReadState & im.group.MemberReadState.$Shape;

            /**
             * Verifies a MemberReadState message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MemberReadState message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MemberReadState
             */
            static fromObject(object: { [k: string]: any }): im.group.MemberReadState;

            /**
             * Creates a plain object from a MemberReadState message. Also converts values to other types if specified.
             * @param message MemberReadState
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.MemberReadState, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MemberReadState to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for MemberReadState
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace MemberReadState {

            /** Properties of a MemberReadState. */
            interface $Properties {

                /** MemberReadState userId */
                userId?: (number|Long|null);

                /** MemberReadState lastReadSeq */
                lastReadSeq?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a MemberReadState. */
            type $Shape = im.group.MemberReadState.$Properties;
        }

        /**
         * Properties of a GetGroupReadStateResp.
         * @deprecated Use im.group.GetGroupReadStateResp.$Properties instead.
         */
        interface IGetGroupReadStateResp extends im.group.GetGroupReadStateResp.$Properties {
        }

        /** Represents a GetGroupReadStateResp. */
        class GetGroupReadStateResp {

            /**
             * Constructs a new GetGroupReadStateResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.group.GetGroupReadStateResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** GetGroupReadStateResp code. */
            code: number;

            /** GetGroupReadStateResp message. */
            message: string;

            /** GetGroupReadStateResp members. */
            members: im.group.MemberReadState.$Properties[];

            /**
             * Creates a new GetGroupReadStateResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetGroupReadStateResp instance
             */
            static create(properties: im.group.GetGroupReadStateResp.$Shape): im.group.GetGroupReadStateResp & im.group.GetGroupReadStateResp.$Shape;
            static create(properties?: im.group.GetGroupReadStateResp.$Properties): im.group.GetGroupReadStateResp;

            /**
             * Encodes the specified GetGroupReadStateResp message. Does not implicitly {@link im.group.GetGroupReadStateResp.verify|verify} messages.
             * @param message GetGroupReadStateResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.group.GetGroupReadStateResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetGroupReadStateResp message, length delimited. Does not implicitly {@link im.group.GetGroupReadStateResp.verify|verify} messages.
             * @param message GetGroupReadStateResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.group.GetGroupReadStateResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetGroupReadStateResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.group.GetGroupReadStateResp & im.group.GetGroupReadStateResp.$Shape} GetGroupReadStateResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.group.GetGroupReadStateResp & im.group.GetGroupReadStateResp.$Shape;

            /**
             * Decodes a GetGroupReadStateResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.group.GetGroupReadStateResp & im.group.GetGroupReadStateResp.$Shape} GetGroupReadStateResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.group.GetGroupReadStateResp & im.group.GetGroupReadStateResp.$Shape;

            /**
             * Verifies a GetGroupReadStateResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetGroupReadStateResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetGroupReadStateResp
             */
            static fromObject(object: { [k: string]: any }): im.group.GetGroupReadStateResp;

            /**
             * Creates a plain object from a GetGroupReadStateResp message. Also converts values to other types if specified.
             * @param message GetGroupReadStateResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.group.GetGroupReadStateResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetGroupReadStateResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for GetGroupReadStateResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace GetGroupReadStateResp {

            /** Properties of a GetGroupReadStateResp. */
            interface $Properties {

                /** GetGroupReadStateResp code */
                code?: (number|null);

                /** GetGroupReadStateResp message */
                message?: (string|null);

                /** GetGroupReadStateResp members */
                members?: (im.group.MemberReadState.$Properties[]|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a GetGroupReadStateResp. */
            type $Shape = im.group.GetGroupReadStateResp.$Properties;
        }
    }

    /** Namespace heartbeat. */
    namespace heartbeat {

        /**
         * Properties of a Ping.
         * @deprecated Use im.heartbeat.Ping.$Properties instead.
         */
        interface IPing extends im.heartbeat.Ping.$Properties {
        }

        /** Represents a Ping. */
        class Ping {

            /**
             * Constructs a new Ping.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.heartbeat.Ping.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** Ping clientTime. */
            clientTime: (number|Long);

            /**
             * Creates a new Ping instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Ping instance
             */
            static create(properties: im.heartbeat.Ping.$Shape): im.heartbeat.Ping & im.heartbeat.Ping.$Shape;
            static create(properties?: im.heartbeat.Ping.$Properties): im.heartbeat.Ping;

            /**
             * Encodes the specified Ping message. Does not implicitly {@link im.heartbeat.Ping.verify|verify} messages.
             * @param message Ping message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.heartbeat.Ping.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Ping message, length delimited. Does not implicitly {@link im.heartbeat.Ping.verify|verify} messages.
             * @param message Ping message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.heartbeat.Ping.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Ping message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.heartbeat.Ping & im.heartbeat.Ping.$Shape} Ping
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.heartbeat.Ping & im.heartbeat.Ping.$Shape;

            /**
             * Decodes a Ping message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.heartbeat.Ping & im.heartbeat.Ping.$Shape} Ping
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.heartbeat.Ping & im.heartbeat.Ping.$Shape;

            /**
             * Verifies a Ping message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Ping message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Ping
             */
            static fromObject(object: { [k: string]: any }): im.heartbeat.Ping;

            /**
             * Creates a plain object from a Ping message. Also converts values to other types if specified.
             * @param message Ping
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.heartbeat.Ping, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Ping to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for Ping
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace Ping {

            /** Properties of a Ping. */
            interface $Properties {

                /** Ping clientTime */
                clientTime?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a Ping. */
            type $Shape = im.heartbeat.Ping.$Properties;
        }

        /**
         * Properties of a Pong.
         * @deprecated Use im.heartbeat.Pong.$Properties instead.
         */
        interface IPong extends im.heartbeat.Pong.$Properties {
        }

        /** Represents a Pong. */
        class Pong {

            /**
             * Constructs a new Pong.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.heartbeat.Pong.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** Pong serverTime. */
            serverTime: (number|Long);

            /** Pong clientTime. */
            clientTime: (number|Long);

            /**
             * Creates a new Pong instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Pong instance
             */
            static create(properties: im.heartbeat.Pong.$Shape): im.heartbeat.Pong & im.heartbeat.Pong.$Shape;
            static create(properties?: im.heartbeat.Pong.$Properties): im.heartbeat.Pong;

            /**
             * Encodes the specified Pong message. Does not implicitly {@link im.heartbeat.Pong.verify|verify} messages.
             * @param message Pong message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.heartbeat.Pong.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Pong message, length delimited. Does not implicitly {@link im.heartbeat.Pong.verify|verify} messages.
             * @param message Pong message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.heartbeat.Pong.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Pong message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.heartbeat.Pong & im.heartbeat.Pong.$Shape} Pong
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.heartbeat.Pong & im.heartbeat.Pong.$Shape;

            /**
             * Decodes a Pong message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.heartbeat.Pong & im.heartbeat.Pong.$Shape} Pong
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.heartbeat.Pong & im.heartbeat.Pong.$Shape;

            /**
             * Verifies a Pong message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Pong message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Pong
             */
            static fromObject(object: { [k: string]: any }): im.heartbeat.Pong;

            /**
             * Creates a plain object from a Pong message. Also converts values to other types if specified.
             * @param message Pong
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.heartbeat.Pong, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Pong to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for Pong
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace Pong {

            /** Properties of a Pong. */
            interface $Properties {

                /** Pong serverTime */
                serverTime?: (number|Long|null);

                /** Pong clientTime */
                clientTime?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a Pong. */
            type $Shape = im.heartbeat.Pong.$Properties;
        }
    }

    /** Namespace message. */
    namespace message {

        /**
         * Properties of a MsgBody.
         * @deprecated Use im.message.MsgBody.$Properties instead.
         */
        interface IMsgBody extends im.message.MsgBody.$Properties {
        }

        /** Represents a MsgBody. */
        class MsgBody {

            /**
             * Constructs a new MsgBody.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.message.MsgBody.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** MsgBody cmd. */
            cmd: im.common.Cmd;

            /** MsgBody authReq. */
            authReq?: (im.auth.AuthReq.$Properties|null);

            /** MsgBody authResp. */
            authResp?: (im.auth.AuthResp.$Properties|null);

            /** MsgBody logoutReq. */
            logoutReq?: (im.auth.LogoutReq.$Properties|null);

            /** MsgBody logoutResp. */
            logoutResp?: (im.auth.LogoutResp.$Properties|null);

            /** MsgBody c2cReq. */
            c2cReq?: (im.chat.C2CReq.$Properties|null);

            /** MsgBody c2cResp. */
            c2cResp?: (im.chat.C2CResp.$Properties|null);

            /** MsgBody c2cNotify. */
            c2cNotify?: (im.chat.C2CNotify.$Properties|null);

            /** MsgBody c2gReq. */
            c2gReq?: (im.group.C2GReq.$Properties|null);

            /** MsgBody c2gResp. */
            c2gResp?: (im.group.C2GResp.$Properties|null);

            /** MsgBody c2gNotify. */
            c2gNotify?: (im.group.C2GNotify.$Properties|null);

            /** MsgBody pullReq. */
            pullReq?: (im.pull.PullReq.$Properties|null);

            /** MsgBody pullResp. */
            pullResp?: (im.pull.PullResp.$Properties|null);

            /** MsgBody ctrlReq. */
            ctrlReq?: (im.ctrl.CtrlReq.$Properties|null);

            /** MsgBody ctrlResp. */
            ctrlResp?: (im.ctrl.CtrlResp.$Properties|null);

            /** MsgBody ctrlPush. */
            ctrlPush?: (im.ctrl.CtrlNotify.$Properties|null);

            /** MsgBody ping. */
            ping?: (im.heartbeat.Ping.$Properties|null);

            /** MsgBody pong. */
            pong?: (im.heartbeat.Pong.$Properties|null);

            /** MsgBody ackReq. */
            ackReq?: (im.ack.AckReq.$Properties|null);

            /** MsgBody ackResp. */
            ackResp?: (im.ack.AckResp.$Properties|null);

            /** MsgBody ackNotify. */
            ackNotify?: (im.ack.AckNotify.$Properties|null);

            /** MsgBody uploadReq. */
            uploadReq?: (im.upload.UploadReq.$Properties|null);

            /** MsgBody uploadResp. */
            uploadResp?: (im.upload.UploadResp.$Properties|null);

            /** MsgBody body. */
            body?: ("authReq"|"authResp"|"logoutReq"|"logoutResp"|"c2cReq"|"c2cResp"|"c2cNotify"|"c2gReq"|"c2gResp"|"c2gNotify"|"pullReq"|"pullResp"|"ctrlReq"|"ctrlResp"|"ctrlPush"|"ping"|"pong"|"ackReq"|"ackResp"|"ackNotify"|"uploadReq"|"uploadResp");

            /**
             * Creates a new MsgBody instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MsgBody instance
             */
            static create(properties: im.message.MsgBody.$Shape): im.message.MsgBody & im.message.MsgBody.$Shape;
            static create(properties?: im.message.MsgBody.$Properties): im.message.MsgBody;

            /**
             * Encodes the specified MsgBody message. Does not implicitly {@link im.message.MsgBody.verify|verify} messages.
             * @param message MsgBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.message.MsgBody.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgBody message, length delimited. Does not implicitly {@link im.message.MsgBody.verify|verify} messages.
             * @param message MsgBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.message.MsgBody.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgBody message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.message.MsgBody & im.message.MsgBody.$Shape} MsgBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.message.MsgBody & im.message.MsgBody.$Shape;

            /**
             * Decodes a MsgBody message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.message.MsgBody & im.message.MsgBody.$Shape} MsgBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.message.MsgBody & im.message.MsgBody.$Shape;

            /**
             * Verifies a MsgBody message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgBody message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgBody
             */
            static fromObject(object: { [k: string]: any }): im.message.MsgBody;

            /**
             * Creates a plain object from a MsgBody message. Also converts values to other types if specified.
             * @param message MsgBody
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.message.MsgBody, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgBody to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for MsgBody
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace MsgBody {

            /** Properties of a MsgBody. */
            interface $Properties {

                /** MsgBody cmd */
                cmd?: (im.common.Cmd|null);

                /** MsgBody authReq */
                authReq?: (im.auth.AuthReq.$Properties|null);

                /** MsgBody authResp */
                authResp?: (im.auth.AuthResp.$Properties|null);

                /** MsgBody logoutReq */
                logoutReq?: (im.auth.LogoutReq.$Properties|null);

                /** MsgBody logoutResp */
                logoutResp?: (im.auth.LogoutResp.$Properties|null);

                /** MsgBody c2cReq */
                c2cReq?: (im.chat.C2CReq.$Properties|null);

                /** MsgBody c2cResp */
                c2cResp?: (im.chat.C2CResp.$Properties|null);

                /** MsgBody c2cNotify */
                c2cNotify?: (im.chat.C2CNotify.$Properties|null);

                /** MsgBody c2gReq */
                c2gReq?: (im.group.C2GReq.$Properties|null);

                /** MsgBody c2gResp */
                c2gResp?: (im.group.C2GResp.$Properties|null);

                /** MsgBody c2gNotify */
                c2gNotify?: (im.group.C2GNotify.$Properties|null);

                /** MsgBody pullReq */
                pullReq?: (im.pull.PullReq.$Properties|null);

                /** MsgBody pullResp */
                pullResp?: (im.pull.PullResp.$Properties|null);

                /** MsgBody ctrlReq */
                ctrlReq?: (im.ctrl.CtrlReq.$Properties|null);

                /** MsgBody ctrlResp */
                ctrlResp?: (im.ctrl.CtrlResp.$Properties|null);

                /** MsgBody ctrlPush */
                ctrlPush?: (im.ctrl.CtrlNotify.$Properties|null);

                /** MsgBody ping */
                ping?: (im.heartbeat.Ping.$Properties|null);

                /** MsgBody pong */
                pong?: (im.heartbeat.Pong.$Properties|null);

                /** MsgBody ackReq */
                ackReq?: (im.ack.AckReq.$Properties|null);

                /** MsgBody ackResp */
                ackResp?: (im.ack.AckResp.$Properties|null);

                /** MsgBody ackNotify */
                ackNotify?: (im.ack.AckNotify.$Properties|null);

                /** MsgBody uploadReq */
                uploadReq?: (im.upload.UploadReq.$Properties|null);

                /** MsgBody uploadResp */
                uploadResp?: (im.upload.UploadResp.$Properties|null);

                /** MsgBody body */
                body?: ("authReq"|"authResp"|"logoutReq"|"logoutResp"|"c2cReq"|"c2cResp"|"c2cNotify"|"c2gReq"|"c2gResp"|"c2gNotify"|"pullReq"|"pullResp"|"ctrlReq"|"ctrlResp"|"ctrlPush"|"ping"|"pong"|"ackReq"|"ackResp"|"ackNotify"|"uploadReq"|"uploadResp");

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Narrowed shape of a MsgBody. */
            type $Shape = {
              cmd?: im.common.Cmd|null;
              authReq?: im.auth.AuthReq.$Shape|null;
              authResp?: im.auth.AuthResp.$Shape|null;
              logoutReq?: im.auth.LogoutReq.$Shape|null;
              logoutResp?: im.auth.LogoutResp.$Shape|null;
              c2cReq?: im.chat.C2CReq.$Shape|null;
              c2cResp?: im.chat.C2CResp.$Shape|null;
              c2cNotify?: im.chat.C2CNotify.$Shape|null;
              c2gReq?: im.group.C2GReq.$Shape|null;
              c2gResp?: im.group.C2GResp.$Shape|null;
              c2gNotify?: im.group.C2GNotify.$Shape|null;
              pullReq?: im.pull.PullReq.$Shape|null;
              pullResp?: im.pull.PullResp.$Shape|null;
              ctrlReq?: im.ctrl.CtrlReq.$Shape|null;
              ctrlResp?: im.ctrl.CtrlResp.$Shape|null;
              ctrlPush?: im.ctrl.CtrlNotify.$Shape|null;
              ping?: im.heartbeat.Ping.$Shape|null;
              pong?: im.heartbeat.Pong.$Shape|null;
              ackReq?: im.ack.AckReq.$Shape|null;
              ackResp?: im.ack.AckResp.$Shape|null;
              ackNotify?: im.ack.AckNotify.$Shape|null;
              uploadReq?: im.upload.UploadReq.$Shape|null;
              uploadResp?: im.upload.UploadResp.$Shape|null;
              $unknowns?: Uint8Array[];
            } & (
              ({ body?: undefined; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "authReq"; authReq: im.auth.AuthReq.$Shape; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "authResp"; authReq?: null; authResp: im.auth.AuthResp.$Shape; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "logoutReq"; authReq?: null; authResp?: null; logoutReq: im.auth.LogoutReq.$Shape; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "logoutResp"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp: im.auth.LogoutResp.$Shape; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "c2cReq"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq: im.chat.C2CReq.$Shape; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "c2cResp"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp: im.chat.C2CResp.$Shape; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "c2cNotify"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify: im.chat.C2CNotify.$Shape; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "c2gReq"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq: im.group.C2GReq.$Shape; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "c2gResp"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp: im.group.C2GResp.$Shape; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "c2gNotify"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify: im.group.C2GNotify.$Shape; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "pullReq"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq: im.pull.PullReq.$Shape; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "pullResp"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp: im.pull.PullResp.$Shape; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "ctrlReq"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq: im.ctrl.CtrlReq.$Shape; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "ctrlResp"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp: im.ctrl.CtrlResp.$Shape; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "ctrlPush"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush: im.ctrl.CtrlNotify.$Shape; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "ping"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping: im.heartbeat.Ping.$Shape; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "pong"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong: im.heartbeat.Pong.$Shape; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "ackReq"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq: im.ack.AckReq.$Shape; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "ackResp"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp: im.ack.AckResp.$Shape; ackNotify?: null; uploadReq?: null; uploadResp?: null }|{ body?: "ackNotify"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify: im.ack.AckNotify.$Shape; uploadReq?: null; uploadResp?: null }|{ body?: "uploadReq"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq: im.upload.UploadReq.$Shape; uploadResp?: null }|{ body?: "uploadResp"; authReq?: null; authResp?: null; logoutReq?: null; logoutResp?: null; c2cReq?: null; c2cResp?: null; c2cNotify?: null; c2gReq?: null; c2gResp?: null; c2gNotify?: null; pullReq?: null; pullResp?: null; ctrlReq?: null; ctrlResp?: null; ctrlPush?: null; ping?: null; pong?: null; ackReq?: null; ackResp?: null; ackNotify?: null; uploadReq?: null; uploadResp: im.upload.UploadResp.$Shape })
            );
        }
    }

    /** Namespace pull. */
    namespace pull {

        /**
         * Properties of a PullReq.
         * @deprecated Use im.pull.PullReq.$Properties instead.
         */
        interface IPullReq extends im.pull.PullReq.$Properties {
        }

        /** Represents a PullReq. */
        class PullReq {

            /**
             * Constructs a new PullReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.pull.PullReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** PullReq limit. */
            limit: number;

            /** PullReq seq. */
            seq: (number|Long);

            /**
             * Creates a new PullReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PullReq instance
             */
            static create(properties: im.pull.PullReq.$Shape): im.pull.PullReq & im.pull.PullReq.$Shape;
            static create(properties?: im.pull.PullReq.$Properties): im.pull.PullReq;

            /**
             * Encodes the specified PullReq message. Does not implicitly {@link im.pull.PullReq.verify|verify} messages.
             * @param message PullReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.pull.PullReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PullReq message, length delimited. Does not implicitly {@link im.pull.PullReq.verify|verify} messages.
             * @param message PullReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.pull.PullReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PullReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.pull.PullReq & im.pull.PullReq.$Shape} PullReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.pull.PullReq & im.pull.PullReq.$Shape;

            /**
             * Decodes a PullReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.pull.PullReq & im.pull.PullReq.$Shape} PullReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.pull.PullReq & im.pull.PullReq.$Shape;

            /**
             * Verifies a PullReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PullReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PullReq
             */
            static fromObject(object: { [k: string]: any }): im.pull.PullReq;

            /**
             * Creates a plain object from a PullReq message. Also converts values to other types if specified.
             * @param message PullReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.pull.PullReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PullReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for PullReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace PullReq {

            /** Properties of a PullReq. */
            interface $Properties {

                /** PullReq limit */
                limit?: (number|null);

                /** PullReq seq */
                seq?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a PullReq. */
            type $Shape = im.pull.PullReq.$Properties;
        }

        /**
         * Properties of a PullResp.
         * @deprecated Use im.pull.PullResp.$Properties instead.
         */
        interface IPullResp extends im.pull.PullResp.$Properties {
        }

        /** Represents a PullResp. */
        class PullResp {

            /**
             * Constructs a new PullResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.pull.PullResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** PullResp code. */
            code: number;

            /** PullResp message. */
            message: string;

            /** PullResp messages. */
            messages: im.common.MessageContent.$Properties[];

            /** PullResp hasMore. */
            hasMore: boolean;

            /**
             * Creates a new PullResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PullResp instance
             */
            static create(properties: im.pull.PullResp.$Shape): im.pull.PullResp & im.pull.PullResp.$Shape;
            static create(properties?: im.pull.PullResp.$Properties): im.pull.PullResp;

            /**
             * Encodes the specified PullResp message. Does not implicitly {@link im.pull.PullResp.verify|verify} messages.
             * @param message PullResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.pull.PullResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PullResp message, length delimited. Does not implicitly {@link im.pull.PullResp.verify|verify} messages.
             * @param message PullResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.pull.PullResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PullResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.pull.PullResp & im.pull.PullResp.$Shape} PullResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.pull.PullResp & im.pull.PullResp.$Shape;

            /**
             * Decodes a PullResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.pull.PullResp & im.pull.PullResp.$Shape} PullResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.pull.PullResp & im.pull.PullResp.$Shape;

            /**
             * Verifies a PullResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PullResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PullResp
             */
            static fromObject(object: { [k: string]: any }): im.pull.PullResp;

            /**
             * Creates a plain object from a PullResp message. Also converts values to other types if specified.
             * @param message PullResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.pull.PullResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PullResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for PullResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace PullResp {

            /** Properties of a PullResp. */
            interface $Properties {

                /** PullResp code */
                code?: (number|null);

                /** PullResp message */
                message?: (string|null);

                /** PullResp messages */
                messages?: (im.common.MessageContent.$Properties[]|null);

                /** PullResp hasMore */
                hasMore?: (boolean|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a PullResp. */
            type $Shape = im.pull.PullResp.$Properties;
        }

        /**
         * Properties of a PullGroupMsgReq.
         * @deprecated Use im.pull.PullGroupMsgReq.$Properties instead.
         */
        interface IPullGroupMsgReq extends im.pull.PullGroupMsgReq.$Properties {
        }

        /** Represents a PullGroupMsgReq. */
        class PullGroupMsgReq {

            /**
             * Constructs a new PullGroupMsgReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.pull.PullGroupMsgReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** PullGroupMsgReq groupId. */
            groupId: (number|Long);

            /** PullGroupMsgReq cursor. */
            cursor: (number|Long);

            /** PullGroupMsgReq limit. */
            limit: number;

            /** PullGroupMsgReq isBackward. */
            isBackward: boolean;

            /**
             * Creates a new PullGroupMsgReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PullGroupMsgReq instance
             */
            static create(properties: im.pull.PullGroupMsgReq.$Shape): im.pull.PullGroupMsgReq & im.pull.PullGroupMsgReq.$Shape;
            static create(properties?: im.pull.PullGroupMsgReq.$Properties): im.pull.PullGroupMsgReq;

            /**
             * Encodes the specified PullGroupMsgReq message. Does not implicitly {@link im.pull.PullGroupMsgReq.verify|verify} messages.
             * @param message PullGroupMsgReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.pull.PullGroupMsgReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PullGroupMsgReq message, length delimited. Does not implicitly {@link im.pull.PullGroupMsgReq.verify|verify} messages.
             * @param message PullGroupMsgReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.pull.PullGroupMsgReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PullGroupMsgReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.pull.PullGroupMsgReq & im.pull.PullGroupMsgReq.$Shape} PullGroupMsgReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.pull.PullGroupMsgReq & im.pull.PullGroupMsgReq.$Shape;

            /**
             * Decodes a PullGroupMsgReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.pull.PullGroupMsgReq & im.pull.PullGroupMsgReq.$Shape} PullGroupMsgReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.pull.PullGroupMsgReq & im.pull.PullGroupMsgReq.$Shape;

            /**
             * Verifies a PullGroupMsgReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PullGroupMsgReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PullGroupMsgReq
             */
            static fromObject(object: { [k: string]: any }): im.pull.PullGroupMsgReq;

            /**
             * Creates a plain object from a PullGroupMsgReq message. Also converts values to other types if specified.
             * @param message PullGroupMsgReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.pull.PullGroupMsgReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PullGroupMsgReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for PullGroupMsgReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace PullGroupMsgReq {

            /** Properties of a PullGroupMsgReq. */
            interface $Properties {

                /** PullGroupMsgReq groupId */
                groupId?: (number|Long|null);

                /** PullGroupMsgReq cursor */
                cursor?: (number|Long|null);

                /** PullGroupMsgReq limit */
                limit?: (number|null);

                /** PullGroupMsgReq isBackward */
                isBackward?: (boolean|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a PullGroupMsgReq. */
            type $Shape = im.pull.PullGroupMsgReq.$Properties;
        }
    }

    /** Namespace upload. */
    namespace upload {

        /**
         * Properties of an UploadReq.
         * @deprecated Use im.upload.UploadReq.$Properties instead.
         */
        interface IUploadReq extends im.upload.UploadReq.$Properties {
        }

        /** Represents an UploadReq. */
        class UploadReq {

            /**
             * Constructs a new UploadReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.upload.UploadReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** UploadReq mediaType. */
            mediaType: number;

            /** UploadReq fileName. */
            fileName: string;

            /** UploadReq size. */
            size: (number|Long);

            /** UploadReq contentType. */
            contentType: string;

            /**
             * Creates a new UploadReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UploadReq instance
             */
            static create(properties: im.upload.UploadReq.$Shape): im.upload.UploadReq & im.upload.UploadReq.$Shape;
            static create(properties?: im.upload.UploadReq.$Properties): im.upload.UploadReq;

            /**
             * Encodes the specified UploadReq message. Does not implicitly {@link im.upload.UploadReq.verify|verify} messages.
             * @param message UploadReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.upload.UploadReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UploadReq message, length delimited. Does not implicitly {@link im.upload.UploadReq.verify|verify} messages.
             * @param message UploadReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.upload.UploadReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UploadReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.upload.UploadReq & im.upload.UploadReq.$Shape} UploadReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.upload.UploadReq & im.upload.UploadReq.$Shape;

            /**
             * Decodes an UploadReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.upload.UploadReq & im.upload.UploadReq.$Shape} UploadReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.upload.UploadReq & im.upload.UploadReq.$Shape;

            /**
             * Verifies an UploadReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UploadReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UploadReq
             */
            static fromObject(object: { [k: string]: any }): im.upload.UploadReq;

            /**
             * Creates a plain object from an UploadReq message. Also converts values to other types if specified.
             * @param message UploadReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.upload.UploadReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UploadReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for UploadReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace UploadReq {

            /** Properties of an UploadReq. */
            interface $Properties {

                /** UploadReq mediaType */
                mediaType?: (number|null);

                /** UploadReq fileName */
                fileName?: (string|null);

                /** UploadReq size */
                size?: (number|Long|null);

                /** UploadReq contentType */
                contentType?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an UploadReq. */
            type $Shape = im.upload.UploadReq.$Properties;
        }

        /**
         * Properties of an UploadResp.
         * @deprecated Use im.upload.UploadResp.$Properties instead.
         */
        interface IUploadResp extends im.upload.UploadResp.$Properties {
        }

        /** Represents an UploadResp. */
        class UploadResp {

            /**
             * Constructs a new UploadResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.upload.UploadResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** UploadResp code. */
            code: number;

            /** UploadResp message. */
            message: string;

            /** UploadResp objectKey. */
            objectKey: string;

            /** UploadResp presignedUrl. */
            presignedUrl: string;

            /** UploadResp expireAt. */
            expireAt: (number|Long);

            /**
             * Creates a new UploadResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UploadResp instance
             */
            static create(properties: im.upload.UploadResp.$Shape): im.upload.UploadResp & im.upload.UploadResp.$Shape;
            static create(properties?: im.upload.UploadResp.$Properties): im.upload.UploadResp;

            /**
             * Encodes the specified UploadResp message. Does not implicitly {@link im.upload.UploadResp.verify|verify} messages.
             * @param message UploadResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.upload.UploadResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UploadResp message, length delimited. Does not implicitly {@link im.upload.UploadResp.verify|verify} messages.
             * @param message UploadResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.upload.UploadResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UploadResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.upload.UploadResp & im.upload.UploadResp.$Shape} UploadResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.upload.UploadResp & im.upload.UploadResp.$Shape;

            /**
             * Decodes an UploadResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.upload.UploadResp & im.upload.UploadResp.$Shape} UploadResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.upload.UploadResp & im.upload.UploadResp.$Shape;

            /**
             * Verifies an UploadResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UploadResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UploadResp
             */
            static fromObject(object: { [k: string]: any }): im.upload.UploadResp;

            /**
             * Creates a plain object from an UploadResp message. Also converts values to other types if specified.
             * @param message UploadResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.upload.UploadResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UploadResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for UploadResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace UploadResp {

            /** Properties of an UploadResp. */
            interface $Properties {

                /** UploadResp code */
                code?: (number|null);

                /** UploadResp message */
                message?: (string|null);

                /** UploadResp objectKey */
                objectKey?: (string|null);

                /** UploadResp presignedUrl */
                presignedUrl?: (string|null);

                /** UploadResp expireAt */
                expireAt?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of an UploadResp. */
            type $Shape = im.upload.UploadResp.$Properties;
        }
    }

    /** Namespace relation. */
    namespace relation {

        /**
         * Properties of a SearchUserReq.
         * @deprecated Use im.relation.SearchUserReq.$Properties instead.
         */
        interface ISearchUserReq extends im.relation.SearchUserReq.$Properties {
        }

        /** Represents a SearchUserReq. */
        class SearchUserReq {

            /**
             * Constructs a new SearchUserReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.SearchUserReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** SearchUserReq keyword. */
            keyword: string;

            /**
             * Creates a new SearchUserReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SearchUserReq instance
             */
            static create(properties: im.relation.SearchUserReq.$Shape): im.relation.SearchUserReq & im.relation.SearchUserReq.$Shape;
            static create(properties?: im.relation.SearchUserReq.$Properties): im.relation.SearchUserReq;

            /**
             * Encodes the specified SearchUserReq message. Does not implicitly {@link im.relation.SearchUserReq.verify|verify} messages.
             * @param message SearchUserReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.SearchUserReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SearchUserReq message, length delimited. Does not implicitly {@link im.relation.SearchUserReq.verify|verify} messages.
             * @param message SearchUserReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.SearchUserReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SearchUserReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.SearchUserReq & im.relation.SearchUserReq.$Shape} SearchUserReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.SearchUserReq & im.relation.SearchUserReq.$Shape;

            /**
             * Decodes a SearchUserReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.SearchUserReq & im.relation.SearchUserReq.$Shape} SearchUserReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.SearchUserReq & im.relation.SearchUserReq.$Shape;

            /**
             * Verifies a SearchUserReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SearchUserReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SearchUserReq
             */
            static fromObject(object: { [k: string]: any }): im.relation.SearchUserReq;

            /**
             * Creates a plain object from a SearchUserReq message. Also converts values to other types if specified.
             * @param message SearchUserReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.SearchUserReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SearchUserReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SearchUserReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SearchUserReq {

            /** Properties of a SearchUserReq. */
            interface $Properties {

                /** SearchUserReq keyword */
                keyword?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SearchUserReq. */
            type $Shape = im.relation.SearchUserReq.$Properties;
        }

        /**
         * Properties of a SearchUserResp.
         * @deprecated Use im.relation.SearchUserResp.$Properties instead.
         */
        interface ISearchUserResp extends im.relation.SearchUserResp.$Properties {
        }

        /** Represents a SearchUserResp. */
        class SearchUserResp {

            /**
             * Constructs a new SearchUserResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.SearchUserResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** SearchUserResp code. */
            code: number;

            /** SearchUserResp message. */
            message: string;

            /** SearchUserResp users. */
            users: im.relation.SearchUserResp.UserInfo.$Properties[];

            /**
             * Creates a new SearchUserResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SearchUserResp instance
             */
            static create(properties: im.relation.SearchUserResp.$Shape): im.relation.SearchUserResp & im.relation.SearchUserResp.$Shape;
            static create(properties?: im.relation.SearchUserResp.$Properties): im.relation.SearchUserResp;

            /**
             * Encodes the specified SearchUserResp message. Does not implicitly {@link im.relation.SearchUserResp.verify|verify} messages.
             * @param message SearchUserResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.SearchUserResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SearchUserResp message, length delimited. Does not implicitly {@link im.relation.SearchUserResp.verify|verify} messages.
             * @param message SearchUserResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.SearchUserResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SearchUserResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.SearchUserResp & im.relation.SearchUserResp.$Shape} SearchUserResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.SearchUserResp & im.relation.SearchUserResp.$Shape;

            /**
             * Decodes a SearchUserResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.SearchUserResp & im.relation.SearchUserResp.$Shape} SearchUserResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.SearchUserResp & im.relation.SearchUserResp.$Shape;

            /**
             * Verifies a SearchUserResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SearchUserResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SearchUserResp
             */
            static fromObject(object: { [k: string]: any }): im.relation.SearchUserResp;

            /**
             * Creates a plain object from a SearchUserResp message. Also converts values to other types if specified.
             * @param message SearchUserResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.SearchUserResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SearchUserResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for SearchUserResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace SearchUserResp {

            /** Properties of a SearchUserResp. */
            interface $Properties {

                /** SearchUserResp code */
                code?: (number|null);

                /** SearchUserResp message */
                message?: (string|null);

                /** SearchUserResp users */
                users?: (im.relation.SearchUserResp.UserInfo.$Properties[]|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a SearchUserResp. */
            type $Shape = im.relation.SearchUserResp.$Properties;

            /**
             * Properties of a UserInfo.
             * @deprecated Use im.relation.SearchUserResp.UserInfo.$Properties instead.
             */
            interface IUserInfo extends im.relation.SearchUserResp.UserInfo.$Properties {
            }

            /** Represents a UserInfo. */
            class UserInfo {

                /**
                 * Constructs a new UserInfo.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: im.relation.SearchUserResp.UserInfo.$Properties);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];

                /** UserInfo userId. */
                userId: (number|Long);

                /** UserInfo userName. */
                userName: string;

                /** UserInfo nickname. */
                nickname: string;

                /** UserInfo avatar. */
                avatar: string;

                /**
                 * Creates a new UserInfo instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns UserInfo instance
                 */
                static create(properties: im.relation.SearchUserResp.UserInfo.$Shape): im.relation.SearchUserResp.UserInfo & im.relation.SearchUserResp.UserInfo.$Shape;
                static create(properties?: im.relation.SearchUserResp.UserInfo.$Properties): im.relation.SearchUserResp.UserInfo;

                /**
                 * Encodes the specified UserInfo message. Does not implicitly {@link im.relation.SearchUserResp.UserInfo.verify|verify} messages.
                 * @param message UserInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                static encode(message: im.relation.SearchUserResp.UserInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified UserInfo message, length delimited. Does not implicitly {@link im.relation.SearchUserResp.UserInfo.verify|verify} messages.
                 * @param message UserInfo message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                static encodeDelimited(message: im.relation.SearchUserResp.UserInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a UserInfo message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns {im.relation.SearchUserResp.UserInfo & im.relation.SearchUserResp.UserInfo.$Shape} UserInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.SearchUserResp.UserInfo & im.relation.SearchUserResp.UserInfo.$Shape;

                /**
                 * Decodes a UserInfo message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns {im.relation.SearchUserResp.UserInfo & im.relation.SearchUserResp.UserInfo.$Shape} UserInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.SearchUserResp.UserInfo & im.relation.SearchUserResp.UserInfo.$Shape;

                /**
                 * Verifies a UserInfo message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a UserInfo message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns UserInfo
                 */
                static fromObject(object: { [k: string]: any }): im.relation.SearchUserResp.UserInfo;

                /**
                 * Creates a plain object from a UserInfo message. Also converts values to other types if specified.
                 * @param message UserInfo
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                static toObject(message: im.relation.SearchUserResp.UserInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this UserInfo to JSON.
                 * @returns JSON object
                 */
                toJSON(): { [k: string]: any };

                /**
                 * Gets the type url for UserInfo
                 * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
                 * @returns The type url
                 */
                static getTypeUrl(prefix?: string): string;
            }

            namespace UserInfo {

                /** Properties of a UserInfo. */
                interface $Properties {

                    /** UserInfo userId */
                    userId?: (number|Long|null);

                    /** UserInfo userName */
                    userName?: (string|null);

                    /** UserInfo nickname */
                    nickname?: (string|null);

                    /** UserInfo avatar */
                    avatar?: (string|null);

                    /** Unknown fields preserved while decoding when enabled */
                    $unknowns?: Uint8Array[];
                }

                /** Shape of a UserInfo. */
                type $Shape = im.relation.SearchUserResp.UserInfo.$Properties;
            }
        }

        /**
         * Properties of a FriendAddReq.
         * @deprecated Use im.relation.FriendAddReq.$Properties instead.
         */
        interface IFriendAddReq extends im.relation.FriendAddReq.$Properties {
        }

        /** Represents a FriendAddReq. */
        class FriendAddReq {

            /**
             * Constructs a new FriendAddReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendAddReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendAddReq userId. */
            userId: (number|Long);

            /** FriendAddReq friendId. */
            friendId: (number|Long);

            /**
             * Creates a new FriendAddReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendAddReq instance
             */
            static create(properties: im.relation.FriendAddReq.$Shape): im.relation.FriendAddReq & im.relation.FriendAddReq.$Shape;
            static create(properties?: im.relation.FriendAddReq.$Properties): im.relation.FriendAddReq;

            /**
             * Encodes the specified FriendAddReq message. Does not implicitly {@link im.relation.FriendAddReq.verify|verify} messages.
             * @param message FriendAddReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendAddReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendAddReq message, length delimited. Does not implicitly {@link im.relation.FriendAddReq.verify|verify} messages.
             * @param message FriendAddReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendAddReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendAddReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendAddReq & im.relation.FriendAddReq.$Shape} FriendAddReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendAddReq & im.relation.FriendAddReq.$Shape;

            /**
             * Decodes a FriendAddReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendAddReq & im.relation.FriendAddReq.$Shape} FriendAddReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendAddReq & im.relation.FriendAddReq.$Shape;

            /**
             * Verifies a FriendAddReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendAddReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendAddReq
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendAddReq;

            /**
             * Creates a plain object from a FriendAddReq message. Also converts values to other types if specified.
             * @param message FriendAddReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendAddReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendAddReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendAddReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendAddReq {

            /** Properties of a FriendAddReq. */
            interface $Properties {

                /** FriendAddReq userId */
                userId?: (number|Long|null);

                /** FriendAddReq friendId */
                friendId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendAddReq. */
            type $Shape = im.relation.FriendAddReq.$Properties;
        }

        /**
         * Properties of a FriendAddResp.
         * @deprecated Use im.relation.FriendAddResp.$Properties instead.
         */
        interface IFriendAddResp extends im.relation.FriendAddResp.$Properties {
        }

        /** Represents a FriendAddResp. */
        class FriendAddResp {

            /**
             * Constructs a new FriendAddResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendAddResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendAddResp code. */
            code: number;

            /** FriendAddResp message. */
            message: string;

            /**
             * Creates a new FriendAddResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendAddResp instance
             */
            static create(properties: im.relation.FriendAddResp.$Shape): im.relation.FriendAddResp & im.relation.FriendAddResp.$Shape;
            static create(properties?: im.relation.FriendAddResp.$Properties): im.relation.FriendAddResp;

            /**
             * Encodes the specified FriendAddResp message. Does not implicitly {@link im.relation.FriendAddResp.verify|verify} messages.
             * @param message FriendAddResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendAddResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendAddResp message, length delimited. Does not implicitly {@link im.relation.FriendAddResp.verify|verify} messages.
             * @param message FriendAddResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendAddResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendAddResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendAddResp & im.relation.FriendAddResp.$Shape} FriendAddResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendAddResp & im.relation.FriendAddResp.$Shape;

            /**
             * Decodes a FriendAddResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendAddResp & im.relation.FriendAddResp.$Shape} FriendAddResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendAddResp & im.relation.FriendAddResp.$Shape;

            /**
             * Verifies a FriendAddResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendAddResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendAddResp
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendAddResp;

            /**
             * Creates a plain object from a FriendAddResp message. Also converts values to other types if specified.
             * @param message FriendAddResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendAddResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendAddResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendAddResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendAddResp {

            /** Properties of a FriendAddResp. */
            interface $Properties {

                /** FriendAddResp code */
                code?: (number|null);

                /** FriendAddResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendAddResp. */
            type $Shape = im.relation.FriendAddResp.$Properties;
        }

        /**
         * Properties of a FriendAddNotify.
         * @deprecated Use im.relation.FriendAddNotify.$Properties instead.
         */
        interface IFriendAddNotify extends im.relation.FriendAddNotify.$Properties {
        }

        /** Represents a FriendAddNotify. */
        class FriendAddNotify {

            /**
             * Constructs a new FriendAddNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendAddNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendAddNotify userId. */
            userId: (number|Long);

            /** FriendAddNotify userName. */
            userName: string;

            /** FriendAddNotify nickname. */
            nickname: string;

            /** FriendAddNotify avatar. */
            avatar: string;

            /**
             * Creates a new FriendAddNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendAddNotify instance
             */
            static create(properties: im.relation.FriendAddNotify.$Shape): im.relation.FriendAddNotify & im.relation.FriendAddNotify.$Shape;
            static create(properties?: im.relation.FriendAddNotify.$Properties): im.relation.FriendAddNotify;

            /**
             * Encodes the specified FriendAddNotify message. Does not implicitly {@link im.relation.FriendAddNotify.verify|verify} messages.
             * @param message FriendAddNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendAddNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendAddNotify message, length delimited. Does not implicitly {@link im.relation.FriendAddNotify.verify|verify} messages.
             * @param message FriendAddNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendAddNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendAddNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendAddNotify & im.relation.FriendAddNotify.$Shape} FriendAddNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendAddNotify & im.relation.FriendAddNotify.$Shape;

            /**
             * Decodes a FriendAddNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendAddNotify & im.relation.FriendAddNotify.$Shape} FriendAddNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendAddNotify & im.relation.FriendAddNotify.$Shape;

            /**
             * Verifies a FriendAddNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendAddNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendAddNotify
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendAddNotify;

            /**
             * Creates a plain object from a FriendAddNotify message. Also converts values to other types if specified.
             * @param message FriendAddNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendAddNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendAddNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendAddNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendAddNotify {

            /** Properties of a FriendAddNotify. */
            interface $Properties {

                /** FriendAddNotify userId */
                userId?: (number|Long|null);

                /** FriendAddNotify userName */
                userName?: (string|null);

                /** FriendAddNotify nickname */
                nickname?: (string|null);

                /** FriendAddNotify avatar */
                avatar?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendAddNotify. */
            type $Shape = im.relation.FriendAddNotify.$Properties;
        }

        /**
         * Properties of a FriendAcceptReq.
         * @deprecated Use im.relation.FriendAcceptReq.$Properties instead.
         */
        interface IFriendAcceptReq extends im.relation.FriendAcceptReq.$Properties {
        }

        /** Represents a FriendAcceptReq. */
        class FriendAcceptReq {

            /**
             * Constructs a new FriendAcceptReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendAcceptReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendAcceptReq userId. */
            userId: (number|Long);

            /** FriendAcceptReq friendId. */
            friendId: (number|Long);

            /**
             * Creates a new FriendAcceptReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendAcceptReq instance
             */
            static create(properties: im.relation.FriendAcceptReq.$Shape): im.relation.FriendAcceptReq & im.relation.FriendAcceptReq.$Shape;
            static create(properties?: im.relation.FriendAcceptReq.$Properties): im.relation.FriendAcceptReq;

            /**
             * Encodes the specified FriendAcceptReq message. Does not implicitly {@link im.relation.FriendAcceptReq.verify|verify} messages.
             * @param message FriendAcceptReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendAcceptReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendAcceptReq message, length delimited. Does not implicitly {@link im.relation.FriendAcceptReq.verify|verify} messages.
             * @param message FriendAcceptReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendAcceptReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendAcceptReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendAcceptReq & im.relation.FriendAcceptReq.$Shape} FriendAcceptReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendAcceptReq & im.relation.FriendAcceptReq.$Shape;

            /**
             * Decodes a FriendAcceptReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendAcceptReq & im.relation.FriendAcceptReq.$Shape} FriendAcceptReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendAcceptReq & im.relation.FriendAcceptReq.$Shape;

            /**
             * Verifies a FriendAcceptReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendAcceptReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendAcceptReq
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendAcceptReq;

            /**
             * Creates a plain object from a FriendAcceptReq message. Also converts values to other types if specified.
             * @param message FriendAcceptReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendAcceptReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendAcceptReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendAcceptReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendAcceptReq {

            /** Properties of a FriendAcceptReq. */
            interface $Properties {

                /** FriendAcceptReq userId */
                userId?: (number|Long|null);

                /** FriendAcceptReq friendId */
                friendId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendAcceptReq. */
            type $Shape = im.relation.FriendAcceptReq.$Properties;
        }

        /**
         * Properties of a FriendAcceptResp.
         * @deprecated Use im.relation.FriendAcceptResp.$Properties instead.
         */
        interface IFriendAcceptResp extends im.relation.FriendAcceptResp.$Properties {
        }

        /** Represents a FriendAcceptResp. */
        class FriendAcceptResp {

            /**
             * Constructs a new FriendAcceptResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendAcceptResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendAcceptResp code. */
            code: number;

            /** FriendAcceptResp message. */
            message: string;

            /**
             * Creates a new FriendAcceptResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendAcceptResp instance
             */
            static create(properties: im.relation.FriendAcceptResp.$Shape): im.relation.FriendAcceptResp & im.relation.FriendAcceptResp.$Shape;
            static create(properties?: im.relation.FriendAcceptResp.$Properties): im.relation.FriendAcceptResp;

            /**
             * Encodes the specified FriendAcceptResp message. Does not implicitly {@link im.relation.FriendAcceptResp.verify|verify} messages.
             * @param message FriendAcceptResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendAcceptResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendAcceptResp message, length delimited. Does not implicitly {@link im.relation.FriendAcceptResp.verify|verify} messages.
             * @param message FriendAcceptResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendAcceptResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendAcceptResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendAcceptResp & im.relation.FriendAcceptResp.$Shape} FriendAcceptResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendAcceptResp & im.relation.FriendAcceptResp.$Shape;

            /**
             * Decodes a FriendAcceptResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendAcceptResp & im.relation.FriendAcceptResp.$Shape} FriendAcceptResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendAcceptResp & im.relation.FriendAcceptResp.$Shape;

            /**
             * Verifies a FriendAcceptResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendAcceptResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendAcceptResp
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendAcceptResp;

            /**
             * Creates a plain object from a FriendAcceptResp message. Also converts values to other types if specified.
             * @param message FriendAcceptResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendAcceptResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendAcceptResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendAcceptResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendAcceptResp {

            /** Properties of a FriendAcceptResp. */
            interface $Properties {

                /** FriendAcceptResp code */
                code?: (number|null);

                /** FriendAcceptResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendAcceptResp. */
            type $Shape = im.relation.FriendAcceptResp.$Properties;
        }

        /**
         * Properties of a FriendAcceptNotify.
         * @deprecated Use im.relation.FriendAcceptNotify.$Properties instead.
         */
        interface IFriendAcceptNotify extends im.relation.FriendAcceptNotify.$Properties {
        }

        /** Represents a FriendAcceptNotify. */
        class FriendAcceptNotify {

            /**
             * Constructs a new FriendAcceptNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendAcceptNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendAcceptNotify userId. */
            userId: (number|Long);

            /** FriendAcceptNotify userName. */
            userName: string;

            /** FriendAcceptNotify nickname. */
            nickname: string;

            /** FriendAcceptNotify avatar. */
            avatar: string;

            /**
             * Creates a new FriendAcceptNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendAcceptNotify instance
             */
            static create(properties: im.relation.FriendAcceptNotify.$Shape): im.relation.FriendAcceptNotify & im.relation.FriendAcceptNotify.$Shape;
            static create(properties?: im.relation.FriendAcceptNotify.$Properties): im.relation.FriendAcceptNotify;

            /**
             * Encodes the specified FriendAcceptNotify message. Does not implicitly {@link im.relation.FriendAcceptNotify.verify|verify} messages.
             * @param message FriendAcceptNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendAcceptNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendAcceptNotify message, length delimited. Does not implicitly {@link im.relation.FriendAcceptNotify.verify|verify} messages.
             * @param message FriendAcceptNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendAcceptNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendAcceptNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendAcceptNotify & im.relation.FriendAcceptNotify.$Shape} FriendAcceptNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendAcceptNotify & im.relation.FriendAcceptNotify.$Shape;

            /**
             * Decodes a FriendAcceptNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendAcceptNotify & im.relation.FriendAcceptNotify.$Shape} FriendAcceptNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendAcceptNotify & im.relation.FriendAcceptNotify.$Shape;

            /**
             * Verifies a FriendAcceptNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendAcceptNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendAcceptNotify
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendAcceptNotify;

            /**
             * Creates a plain object from a FriendAcceptNotify message. Also converts values to other types if specified.
             * @param message FriendAcceptNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendAcceptNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendAcceptNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendAcceptNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendAcceptNotify {

            /** Properties of a FriendAcceptNotify. */
            interface $Properties {

                /** FriendAcceptNotify userId */
                userId?: (number|Long|null);

                /** FriendAcceptNotify userName */
                userName?: (string|null);

                /** FriendAcceptNotify nickname */
                nickname?: (string|null);

                /** FriendAcceptNotify avatar */
                avatar?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendAcceptNotify. */
            type $Shape = im.relation.FriendAcceptNotify.$Properties;
        }

        /**
         * Properties of a FriendDeleteReq.
         * @deprecated Use im.relation.FriendDeleteReq.$Properties instead.
         */
        interface IFriendDeleteReq extends im.relation.FriendDeleteReq.$Properties {
        }

        /** Represents a FriendDeleteReq. */
        class FriendDeleteReq {

            /**
             * Constructs a new FriendDeleteReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendDeleteReq.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendDeleteReq userId. */
            userId: (number|Long);

            /** FriendDeleteReq friendId. */
            friendId: (number|Long);

            /**
             * Creates a new FriendDeleteReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendDeleteReq instance
             */
            static create(properties: im.relation.FriendDeleteReq.$Shape): im.relation.FriendDeleteReq & im.relation.FriendDeleteReq.$Shape;
            static create(properties?: im.relation.FriendDeleteReq.$Properties): im.relation.FriendDeleteReq;

            /**
             * Encodes the specified FriendDeleteReq message. Does not implicitly {@link im.relation.FriendDeleteReq.verify|verify} messages.
             * @param message FriendDeleteReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendDeleteReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendDeleteReq message, length delimited. Does not implicitly {@link im.relation.FriendDeleteReq.verify|verify} messages.
             * @param message FriendDeleteReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendDeleteReq.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendDeleteReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendDeleteReq & im.relation.FriendDeleteReq.$Shape} FriendDeleteReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendDeleteReq & im.relation.FriendDeleteReq.$Shape;

            /**
             * Decodes a FriendDeleteReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendDeleteReq & im.relation.FriendDeleteReq.$Shape} FriendDeleteReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendDeleteReq & im.relation.FriendDeleteReq.$Shape;

            /**
             * Verifies a FriendDeleteReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendDeleteReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendDeleteReq
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendDeleteReq;

            /**
             * Creates a plain object from a FriendDeleteReq message. Also converts values to other types if specified.
             * @param message FriendDeleteReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendDeleteReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendDeleteReq to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendDeleteReq
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendDeleteReq {

            /** Properties of a FriendDeleteReq. */
            interface $Properties {

                /** FriendDeleteReq userId */
                userId?: (number|Long|null);

                /** FriendDeleteReq friendId */
                friendId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendDeleteReq. */
            type $Shape = im.relation.FriendDeleteReq.$Properties;
        }

        /**
         * Properties of a FriendDeleteResp.
         * @deprecated Use im.relation.FriendDeleteResp.$Properties instead.
         */
        interface IFriendDeleteResp extends im.relation.FriendDeleteResp.$Properties {
        }

        /** Represents a FriendDeleteResp. */
        class FriendDeleteResp {

            /**
             * Constructs a new FriendDeleteResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendDeleteResp.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendDeleteResp code. */
            code: number;

            /** FriendDeleteResp message. */
            message: string;

            /**
             * Creates a new FriendDeleteResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendDeleteResp instance
             */
            static create(properties: im.relation.FriendDeleteResp.$Shape): im.relation.FriendDeleteResp & im.relation.FriendDeleteResp.$Shape;
            static create(properties?: im.relation.FriendDeleteResp.$Properties): im.relation.FriendDeleteResp;

            /**
             * Encodes the specified FriendDeleteResp message. Does not implicitly {@link im.relation.FriendDeleteResp.verify|verify} messages.
             * @param message FriendDeleteResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendDeleteResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendDeleteResp message, length delimited. Does not implicitly {@link im.relation.FriendDeleteResp.verify|verify} messages.
             * @param message FriendDeleteResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendDeleteResp.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendDeleteResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendDeleteResp & im.relation.FriendDeleteResp.$Shape} FriendDeleteResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendDeleteResp & im.relation.FriendDeleteResp.$Shape;

            /**
             * Decodes a FriendDeleteResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendDeleteResp & im.relation.FriendDeleteResp.$Shape} FriendDeleteResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendDeleteResp & im.relation.FriendDeleteResp.$Shape;

            /**
             * Verifies a FriendDeleteResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendDeleteResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendDeleteResp
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendDeleteResp;

            /**
             * Creates a plain object from a FriendDeleteResp message. Also converts values to other types if specified.
             * @param message FriendDeleteResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendDeleteResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendDeleteResp to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendDeleteResp
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendDeleteResp {

            /** Properties of a FriendDeleteResp. */
            interface $Properties {

                /** FriendDeleteResp code */
                code?: (number|null);

                /** FriendDeleteResp message */
                message?: (string|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendDeleteResp. */
            type $Shape = im.relation.FriendDeleteResp.$Properties;
        }

        /**
         * Properties of a FriendDeleteNotify.
         * @deprecated Use im.relation.FriendDeleteNotify.$Properties instead.
         */
        interface IFriendDeleteNotify extends im.relation.FriendDeleteNotify.$Properties {
        }

        /** Represents a FriendDeleteNotify. */
        class FriendDeleteNotify {

            /**
             * Constructs a new FriendDeleteNotify.
             * @param [properties] Properties to set
             */
            constructor(properties?: im.relation.FriendDeleteNotify.$Properties);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];

            /** FriendDeleteNotify userId. */
            userId: (number|Long);

            /**
             * Creates a new FriendDeleteNotify instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FriendDeleteNotify instance
             */
            static create(properties: im.relation.FriendDeleteNotify.$Shape): im.relation.FriendDeleteNotify & im.relation.FriendDeleteNotify.$Shape;
            static create(properties?: im.relation.FriendDeleteNotify.$Properties): im.relation.FriendDeleteNotify;

            /**
             * Encodes the specified FriendDeleteNotify message. Does not implicitly {@link im.relation.FriendDeleteNotify.verify|verify} messages.
             * @param message FriendDeleteNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encode(message: im.relation.FriendDeleteNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FriendDeleteNotify message, length delimited. Does not implicitly {@link im.relation.FriendDeleteNotify.verify|verify} messages.
             * @param message FriendDeleteNotify message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            static encodeDelimited(message: im.relation.FriendDeleteNotify.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FriendDeleteNotify message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns {im.relation.FriendDeleteNotify & im.relation.FriendDeleteNotify.$Shape} FriendDeleteNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): im.relation.FriendDeleteNotify & im.relation.FriendDeleteNotify.$Shape;

            /**
             * Decodes a FriendDeleteNotify message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns {im.relation.FriendDeleteNotify & im.relation.FriendDeleteNotify.$Shape} FriendDeleteNotify
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): im.relation.FriendDeleteNotify & im.relation.FriendDeleteNotify.$Shape;

            /**
             * Verifies a FriendDeleteNotify message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FriendDeleteNotify message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FriendDeleteNotify
             */
            static fromObject(object: { [k: string]: any }): im.relation.FriendDeleteNotify;

            /**
             * Creates a plain object from a FriendDeleteNotify message. Also converts values to other types if specified.
             * @param message FriendDeleteNotify
             * @param [options] Conversion options
             * @returns Plain object
             */
            static toObject(message: im.relation.FriendDeleteNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FriendDeleteNotify to JSON.
             * @returns JSON object
             */
            toJSON(): { [k: string]: any };

            /**
             * Gets the type url for FriendDeleteNotify
             * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
             * @returns The type url
             */
            static getTypeUrl(prefix?: string): string;
        }

        namespace FriendDeleteNotify {

            /** Properties of a FriendDeleteNotify. */
            interface $Properties {

                /** FriendDeleteNotify userId */
                userId?: (number|Long|null);

                /** Unknown fields preserved while decoding when enabled */
                $unknowns?: Uint8Array[];
            }

            /** Shape of a FriendDeleteNotify. */
            type $Shape = im.relation.FriendDeleteNotify.$Properties;
        }
    }
}
