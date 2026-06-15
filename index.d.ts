// Shared QR types

export type VersionNumber = number;
export type VersionRange = [min: VersionNumber, max: VersionNumber];
export type VersionOption = VersionNumber | VersionRange;

export type EclNumber = 0 | 1 | 2 | 3;
export type EclRange = [min: EclNumber, max: EclNumber];
export type EclOption = EclNumber | EclRange;

export type MaskNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type GridBit = 0 | 1;
export type Point = [x: number, y: number];
export type SVGPathData = string;
export type SVGMarkup = string;
export type SVGColor = string;

export interface QRIcon {
  d: SVGPathData[];
  scale: number;
}

export interface QRMetadata {
  data?: string;
  preview?: string;
  icon?: QRIcon;
}

export type QRInput = string | DataType<DataSpec>;

// Root API

export interface CreateQROptions extends EncodingOptions {
  mask?: MaskNumber;
}

export function createQR(data: QRInput, options?: CreateQROptions): QR;
export function iterateQRs(
  data: QRInput,
  encodingOptions?: EncodingOptions,
): Generator<QR>;

// Grid

export type QRCodewords = Uint8Array;
export type GridTile = [x: number, y: number, isOn: boolean];
export type DataPath = number[];
export type AlignmentPositions = number[];

export interface QRParameters {
  version: VersionNumber;
  ecl: EclNumber;
  mask: MaskNumber;
  codewords: QRCodewords;
  data?: string;
  preview?: string;
  icon?: QRIcon;
}

export class Grid {
  constructor(
    w: number,
    h?: number | null,
    valueBits?: Uint32Array | null,
    usedBits?: Uint32Array | null,
  );

  w: number;
  h: number;
  valueBits: Uint32Array;
  usedBits: Uint32Array;

  clear(): void;
  set(x?: number, y?: number, v?: number): void;
  get(x?: number, y?: number): GridBit;
  used(x?: number, y?: number): GridBit;

  ons(): Generator<GridTile>;
  offs(): Generator<GridTile>;
  tiles(onlyOn?: boolean | null): Generator<GridTile>;

  clone(): Grid;
  crop(x: number, y: number, w: number, h: number): Grid;
  frame(x: number, y: number, w: number, h: number): Grid;

  union(...grids: Grid[]): this;
  erase(...gridsToErase: Grid[]): this;
  intersect(...gridsToIntersect: Grid[]): this;
  invert(): this;
  xor(grid: Grid): this;

  static union(...grids: Grid[]): Grid;
  static erase(start: Grid, ...gridsToErase: Grid[]): Grid;
  static intersect(...gridsToIntersect: Grid[]): Grid;
  static invert(original: Grid): Grid;
  static xor(a: Grid, b: Grid): Grid;
}

export class QR {
  constructor(parameters: QRParameters);

  version: VersionNumber;
  ecl: EclNumber;
  codewords: QRCodewords;
  size: number;
  data?: string;
  preview?: string;
  icon?: QRIcon;

  get mask(): MaskNumber;
  set mask(value: MaskNumber);

  get grid(): Grid;
  get functional_grid(): Grid;
  get finder_grid(): Grid;
  get timing_grid(): Grid;
  get alignment_grid(): Grid;
  get format_grid(): Grid;
  get version_grid(): Grid;
  get data_grid(): Grid;
  get rawdata_grid(): Grid;

  clone(): QR;
  toBytes(): Uint8Array;
  toString(): string;
  toJSON(): string;

  static fromBytes(bytes: Uint8Array): QR;
  static fromString(str: string): QR;
  static fromJSON(str: string): QR;
}

export function getMaskGrid(version: VersionNumber, mask: MaskNumber): Grid;
export function getDataPath(version: VersionNumber): DataPath;
export function getAlignmentPositions(version: VersionNumber): AlignmentPositions;
export function getFunctionalGrid(
  version?: VersionNumber,
  ecl?: EclNumber,
  mask?: MaskNumber,
): Grid;

// Encode

export type ModeName = "numeric" | "alpha" | "byte" | "kanji";
export type StrategyOption = "optimal" | "naive" | ModeName | Strategy;
export type StrategyStep = [mode: ModeName, length: number];

export interface EncodingOptions {
  version?: VersionOption;
  ecl?: EclOption;
  surplus?: number;
  strategy?: StrategyOption;
}

export interface OptimalStrategyResult {
  strategy: Strategy;
  version: VersionNumber;
  ecl: EclNumber;
}

export class Strategy {
  constructor(cost?: number, steps?: StrategyStep[]);

  cost: number;
  steps: StrategyStep[];
}

export class CodewordSequence extends Uint8Array {
  constructor(
    data: string,
    strategy: Strategy,
    version: VersionNumber,
    ecl: EclNumber,
  );
}

export function optimalStrategy(
  data: string,
  encodingOptions?: EncodingOptions,
): OptimalStrategyResult;

export function findMinimumVersion(
  data: string,
  minVersion?: VersionNumber,
  maxVersion?: VersionNumber,
  minEcl?: EclNumber,
  minSurplus?: number,
): [strategy: Strategy, version: VersionNumber];

export function allStrategies(
  data: string,
  version: VersionNumber,
  ecl: EclNumber,
): Generator<Strategy>;

export function naiveStrategy(
  data: string,
  version?: VersionNumber,
  singleMode?: ModeName | null,
): Strategy;

export function minStrategy(data: string, version?: VersionNumber): Strategy;

// Features

export type LeaderboardEntry = {
  metric: string;
  direction: "min" | "max";
  score: number;
  qr: QR;
  cache: unknown;
};

export class Leaderboard {
  constructor(
    scorer: (qr: QR) => { scores: Record<string, number>; cache?: unknown },
    options?: { capacity?: number },
  );

  scorer: (qr: QR) => { scores: Record<string, number>; cache?: unknown };
  options: { capacity: number };
  callbacks: Array<(event: LeaderboardEntry) => void>;
  buckets: Record<string, {
    min: BottomN<LeaderboardEntry>;
    max: TopN<LeaderboardEntry>;
  }>;

  getOrMakeBuckets(metric: string): {
    min: BottomN<LeaderboardEntry>;
    max: TopN<LeaderboardEntry>;
  };
  consider(qr: QR): void;
  listen(callback: (event: LeaderboardEntry) => void): void;
  notify(event: LeaderboardEntry): void;
  min(metric: string): Generator<LeaderboardEntry>;
  max(metric: string): Generator<LeaderboardEntry>;
  results(metric: string): {
    min: LeaderboardEntry[];
    max: LeaderboardEntry[];
  };
  allResults(): Record<string, ReturnType<Leaderboard["results"]>>;
}

export class TopN<T = unknown> {
  constructor(capacity?: number, objects?: T[], priorities?: number[]);

  readonly capacity: number;
  readonly size: number;

  peekPriority(): number;
  peek(): T | null | undefined;
  consider(score: number, object: T): boolean;
  drain(): Generator<{ score: number; object: T }>;
  [Symbol.iterator](): Generator<{ score: number; object: T }>;
}

export class BottomN<T = unknown> extends TopN<T> {
  consider(score: number, object: T): boolean;
  peekPriority(): number;
  drain(): Generator<{ score: number; object: T }>;
  [Symbol.iterator](): Generator<{ score: number; object: T }>;
}

export function standardPenalty(grid: Grid): {
  scores: {
    penalty: number;
  };
  cache: {
    penalty1: number;
    penalty2: number;
    penalty3: number;
    penalty4: number;
  };
};

/**
 * Shapes may include any extra metadata; only `points` is required here.
 */
export function findFits<TShape extends { points: Array<[number, number, number?]> }>(
  grid: Grid,
  shapes: Record<string, TShape>,
): {
  scores: {
    candidates: number;
  };
  cache: {
    fits: Array<{
      shape: TShape;
      coords: { x: number; y: number };
    }>;
  };
};

/**
 * Preserves the original shape objects on each placement.
 */
export function packShapes<TShape extends { points: Array<[number, number, number?]> }>(
  grid: Grid,
  shapes: Record<string, TShape>,
): {
  scores: {
    num_placements: number;
  };
  cache: {
    placements: Array<{
      shape: TShape;
      coords: { x: number; y: number };
    }>;
    used: Grid;
    unused: Grid;
  };
};

export function tileClusters(
  grid: Grid,
  options?: { diagonal?: boolean; value?: boolean },
): {
  scores: {
    readonly num_dots: number;
    readonly num_shapes: number;
    readonly biggest_shape: number;
  };
  cache: {
    shapes: Array<Array<Point>>;
    dots: Point[];
  };
};

export function penStrokes(
  grid: Grid,
  options?: {
    fill?: boolean;
    thickness?: number;
    radius?: number;
    expand_stroke?: boolean;
  },
): {
  scores: {
    num_dots: number;
    num_clusters: number;
    num_paths: number;
    svg_len: number;
  };
  cache: {
    strokes: string[];
    dots: Point[];
  };
};

// Render

export type IconSlot = "auto" | "top" | "center" | "bottom";

export interface LandmarkDrawOptions {
  roundness?: number;
  ring?: number;
  center?: number;
}

export interface DotDrawOptions {
  size?: number;
  radius?: number;
}

export interface LineDrawOptions {
  fill?: boolean;
  thickness?: number;
  radius?: number;
}

export interface PathDirectionOptions {
  clockwise?: boolean;
}

export interface RenderColors {
  landmarks?: SVGColor;
  dots?: SVGColor;
  lines?: SVGColor;
  icon?: SVGColor;
  background?: SVGColor | false;
}

export type SVGIconOptions = QRIcon;

export interface DrawSVGOptions {
  margin?: number;
  width?: number;
  height?: number;
  colors?: RenderColors;
  lines?: LineDrawOptions;
  dots?: DotDrawOptions;
  finders?: LandmarkDrawOptions;
  aligns?: LandmarkDrawOptions;
  icon?: SVGIconOptions | null;
}

export interface IconBox {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export function drawSVG(qr: QR, options?: DrawSVGOptions): SVGMarkup;
export function drawAligns(qr: QR, options?: LandmarkDrawOptions): SVGPathData;
export function drawFinders(qr: QR, options?: LandmarkDrawOptions): SVGPathData;
export function drawDots(points?: Point[], options?: DotDrawOptions): SVGPathData;

export function getIconBox(qr: QR, slot?: IconSlot): IconBox;

export function rectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  options?: PathDirectionOptions,
): SVGPathData;
export function boxPath(
  cx: number,
  cy: number,
  size: number,
  r: number,
  options?: PathDirectionOptions,
): SVGPathData;
export function circlePath(cx: number, cy: number, radius?: number): SVGPathData;

// Utils

export interface EclConfig {
  formatBits: number;
  codewords_per_block: Uint8Array;
  num_ecc_blocks: Uint8Array;
}

export type MaskFunction = (x: number, y: number) => boolean;

export interface QRMode {
  modeBits: number;
  name: ModeName;
  charCost(character: string): number;
  numCharCountBits(version: VersionNumber): number;
  groupSize: number;
  getMarginal(character: string, phase?: number): number;
  write(data: string, buffer: Uint8Array, bitPosRef: { pos: number }): void;
}

export const ECLS: EclConfig[];
export const MASKS: MaskFunction[];
export const MODES: QRMode[];
export const supportsKanji: boolean;

export function getNumDataCodewords(
  version: VersionNumber,
  ecl: EclNumber,
): number;
export function getNumRawDataModules(version: VersionNumber): number;

// Data

export type PermutationIndex = number;
export type PermutationTuple<Output = string> = [value: Output, index: PermutationIndex];

export interface PermutationSource<Output = string> {
  total: number;
  get(index: PermutationIndex): Output;
}

export type DataSpec<Value = unknown, Options = unknown> = {
  Value: Value;
  Options: Options;
};

export class DataType<T extends DataSpec> {
  constructor(
    value: T["Value"],
    parse: (value: T["Value"]) => string,
    permute: (value: T["Value"], options?: T["Options"]) => PermutationSource<string>,
    icon?: (value: T["Value"]) => QRIcon,
    preview?: (value: T["Value"]) => string,
  );

  value: T["Value"];
  icon?: QRIcon;
  preview?: string;

  toString(): string;
  permute(options?: T["Options"]): PermutationSet<string>;
  [Symbol.toPrimitive](): string;
  [Symbol.iterator](): Generator<PermutationTuple<string>>;
}

export class PermutationSet<Output = string> {
  constructor(source: PermutationSource<Output>);

  total: number;
  get(index: PermutationIndex): Output;
  [Symbol.iterator](): Generator<PermutationTuple<Output>>;
  batch(start?: number, stride?: number): Generator<PermutationTuple<Output>>;
}

export type JSONSchema = Record<string, unknown>;
export type DataFormat = "bitcoin" | "event" | "wifi" | "phone" | "geo" | "vcard" | "ethereum" | "sms" | "url" | "email";

export const formats: DataFormat[];
export function formatData(type: DataFormat, value: unknown): string;
export function permuteData(type: DataFormat, value: unknown, options?: unknown): PermutationSet<string>;
export function previewData(type: DataFormat, value: unknown): string;
export function iconData(type: DataFormat, value: unknown): SVGIconOptions;
export function schemaData(type: DataFormat): {
  value: JSONSchema;
  permute: JSONSchema;
};

// DATA:START (Generated)
  
  // --- Bitcoin ---
  /**
   * Bitcoin payment request based on BIP-21 URI scheme for scannable QR codes
   */
  export interface BitcoinValue {
    /**
     * Bitcoin address (e.g., legacy, SegWit)
     */
    address: string;
    /**
     * Amount in BTC (decimal)
     */
    amount?: number;
    /**
     * Label for the payment (e.g., recipient name)
     */
    label?: string;
    /**
     * Message describing the payment
     */
    message?: string;
  }
  export interface BitcoinOptions {}
  export type BitcoinData = { Value: BitcoinValue; Options: BitcoinOptions; }
  export function bitcoinData(data:BitcoinValue):DataType<BitcoinData>;
    
  // --- Event ---
  /**
   * Event information based on VEvent spec for iCal links in QR codes
   */
  export interface EventValue {
    summary: string;
    description?: string;
    location?: string;
    /**
     * ISO 8601 date-time or date
     */
    start: string;
    /**
     * ISO 8601 date-time or date (mutually exclusive with duration)
     */
    end?: string;
    /**
     * ISO 8601 duration (mutually exclusive with end)
     */
    duration?: string;
    url?: string;
    /**
     * Email or CAL-ADDRESS format
     */
    organizer?: string;
    geo?: {
      latitude: number;
      longitude: number;
    };
    categories?: string[];
    status?: "TENTATIVE" | "CONFIRMED" | "CANCELLED";
    /**
     * Unique ID for this event. Omit for a deterministic ID derived from the event values, pass a string to set it manually, or pass `true` to generate a UUID.
     */
    uid?: string | boolean;
    /**
     * ISO 8601 date-time for the iCalendar DTSTAMP field. Defaults to the current time.
     */
    dtstamp?: string | Date;
  }
  export interface EventOptions {}
  export type EventData = { Value: EventValue; Options: EventOptions; }
  export function eventData(data:EventValue):DataType<EventData>;
    
  // --- Wifi ---
  export type WifiValue = WPADefault | NoPassword | EAP;
  
  /**
   * Option for most WiFi setups (residential, small business)
   */
  export interface WPADefault {
    ssid: string;
    pass: string;
    type: "WPA";
    hidden?: boolean;
    disableTransition?: 0 | 1;
  }
  /**
   * Open network with no password. Scanners may join it without prompting for credentials.
   */
  export interface NoPassword {
    ssid: string;
    type?: "nopass";
    hidden?: boolean;
  }
  /**
   * Used for enterprise Wifi configurations
   */
  export interface EAP {
    ssid: string;
    pass?: string;
    type: "WPA2-EAP";
    hidden?: boolean;
    eap: "TTLS" | "PWD" | "PEAP" | "TLS" | "AKA" | "FAST" | "SIM";
    anon?: string;
    identity?: string;
    phase2?: "GTC" | "NONE" | "PAP" | "MSCHAP" | "MSCHAPV2";
  }
  /**
   * WiFi payload permutations cover safe field reordering, optional default fields, prefix casing, and optional quoting.
   */
  export interface WifiOptions {
    /**
     * `N!` flag to reorder each pair
     */
    ordering?: boolean;
    /**
     * `2` WIFI, wifi
     */
    prefixCaps?: boolean;
    /**
     * `2` "H:false", "" for public networks
     */
    permute_H_false?: boolean;
    /**
     * `2` "R:0", "" for WPA2 networks
     */
    permute_R_0?: boolean;
    /**
     * `1,2` use quotes when not necessary
     */
    permute_quotes?: boolean;
  }
  export type WifiData = { Value: WifiValue; Options: WifiOptions; }
  export function wifiData(data:WifiValue):DataType<WifiData>;
    
  // --- Phone ---
  /**
   * Call a phone number with optional extension
   */
  export interface PhoneValue {
    /**
     * local number only. non-numeric chars are ignored
     */
    number: string;
    /**
     * numeric country code. [list](https://countrycode.org/)
     */
    countryCode?: string;
    /**
     * optional extension
     */
    extension?: string;
  }
  /**
   * Per [RFC 3966](https://www.rfc-editor.org/rfc/rfc3966.html), spacers `.-()` are ignored, enabling safe permutation possibilities
   */
  export interface PhoneOptions {
    validSpacers?: ("-" | ".")[];
    prefixCaps?: boolean;
    parenGroups?: boolean;
    groupings?: number[][];
  }
  export type PhoneData = { Value: PhoneValue; Options: PhoneOptions; }
  export function phoneData(data:PhoneValue):DataType<PhoneData>;
    
  // --- Geo ---
  /**
   * Link to a location using latitude and longitude
   */
  export interface GeoValue {
    latitude: number;
    longitude: number;
    altitude?: number;
  }
  /**
   * Iterate over ~equal coordinates that point to the same location
   */
  export interface GeoOptions {
    prefixCaps?: boolean;
    varyPrecision?: boolean;
    maxDecimals?: number;
    precision?: number;
  }
  export type GeoData = { Value: GeoValue; Options: GeoOptions; }
  export function geoData(data:GeoValue):DataType<GeoData>;
    
  // --- Vcard ---
  /**
   * Contact information based on vCard spec for scannable QR codes
   */
  export interface VcardValue {
    fullName: string;
    givenName?: string;
    familyName?: string;
    organization?: string;
    title?: string;
    photo?: {
      type: "JPEG" | "PNG" | "GIF" | "SVG+XML";
      base64: string;
    };
    phones?: {
      value: string;
      type?: "home" | "work" | "mobile" | "fax" | "other";
    }[];
    emails?: {
      value: string;
      type?: "home" | "work" | "other";
    }[];
    addresses?: {
      street?: string;
      locality?: string;
      region?: string;
      postalCode?: string;
      country?: string;
      type?: "home" | "work" | "other";
    }[];
    url?: string;
    note?: string;
    /**
     * ISO 8601 date
     */
    birthday?: string;
    /**
     * Stable contact UID. Use `true` to generate a UUID, or pass a string to keep output deterministic.
     */
    uid?: string | boolean;
    /**
     * Revision timestamp. Use `true` for the current time, or pass an ISO date-time string or Date for deterministic output.
     */
    rev?: string | boolean | Date;
  }
  export interface VcardOptions {}
  export type VcardData = { Value: VcardValue; Options: VcardOptions; }
  export function vcardData(data:VcardValue):DataType<VcardData>;
    
  // --- Ethereum ---
  export type EthereumValue =
    | {
        /**
         * Ethereum address or ENS name (recipient)
         */
        address: string;
        /**
         * Chain ID (e.g., 1 for mainnet)
         */
        chainId?: number;
        /**
         * Amount in ETH (decimal)
         */
        amount: number;
      }
    | {
        /**
         * ERC-20 token contract address
         */
        token: string;
        /**
         * Recipient Ethereum address or ENS name
         */
        address: string;
        /**
         * Chain ID (e.g., 1 for mainnet)
         */
        chainId: number;
        /**
         * Amount in token units (decimal)
         */
        amount: number;
        /**
         * Token decimals (default: 18)
         */
        decimals: number;
      };
  export interface EthereumOptions {}
  export type EthereumData = { Value: EthereumValue; Options: EthereumOptions; }
  export function ethereumData(data:EthereumValue):DataType<EthereumData>;
    
  // --- Sms ---
  /**
   * Send an SMS text with an optional message
   */
  export interface SmsValue {
    /**
     * local number only. non-numeric chars are ignored
     */
    number: string;
    /**
     * numeric country code. [list](https://countrycode.org/)
     */
    countryCode?: string;
    /**
     * optional message template
     */
    message?: string;
  }
  export interface SmsOptions {
    /**
     * `8` permute casing of `sms`
     */
    prefixCaps?: boolean;
    /**
     * `16` permute casing of `body`
     */
    queryCaps?: boolean;
    /**
     * `N^M` valid spacers `-.()` per spec
     */
    validSpacers?: ("-" | ".")[];
    /**
     * `N^M` indexes for spacers to divide numbers. not deduped
     */
    groupings?: number[][];
  }
  export type SmsData = { Value: SmsValue; Options: SmsOptions; }
  export function smsData(data:SmsValue):DataType<SmsData>;
    
  // --- Url ---
  export type UrlValue = URLString | URLObject;
  
  export interface URLString {
    /**
     * URL string. Normalized and parsed with `new URL(...)`
     */
    url: string;
  }
  /**
   * Ideal for granular permutations
   */
  export interface URLObject {
    /**
     * Protocol string `"https"`
     */
    protocol: string;
    /**
     * Hostname string `"qrs.art"`
     */
    hostname: string;
    /**
     * Pathname string `"/studio"`
     */
    pathname?: string;
    /**
     * Query string `"?page=1"`. combined with `query`
     */
    search?: string;
    /**
     * Query object `{ page: 1}`. combined with `search`
     */
    query?: {};
    /**
     * Hash (not seen by server) `"#content"`
     */
    hash?: string;
  }
  /**
   * URLs are safely case-insenstive for both the *protocol* and *hostname*.
   */
  export interface UrlOptions {
    /**
     * Flag to permute casing of protocol `2^N`
     */
    protocolCaps?: boolean;
    /**
     * Flag to permute casing of hostname `2^N`
     */
    hostnameCaps?: boolean;
    /**
     * Flag to reorder search string parameters `N!`
     */
    searchOrdering?: boolean;
  }
  export type UrlData = { Value: UrlValue; Options: UrlOptions; }
  export function urlData(data:UrlValue):DataType<UrlData>;
    
  // --- Email ---
  /**
   * Open email client populated values
   */
  export interface EmailValue {
    to: string;
    subject?: string;
    body?: string;
    cc?: string;
    bcc?: string;
  }
  export interface EmailOptions {
    prefixCaps?: boolean;
    hostnameCaps?: boolean;
    queryCaps?: boolean;
    queryOrdering?: boolean;
  }
  export type EmailData = { Value: EmailValue; Options: EmailOptions; }
  export function emailData(data:EmailValue):DataType<EmailData>;
// DATA:END (Generated)
