import jsYaml from 'js-yaml';

export interface IProps {
  uType: string;
  fileID: string;
}

export class UnityObject {
  props: IProps;
  body: any = null;

  constructor(props: IProps) {
    this.props = props;
  }

  addBody = (body: any) => {
    this.body = body;
  }

  public static tryParseUnityObject(source: string) {
    const matchResult = /^--- \!u\!(\d+) \&(\d+)/.exec(source);

    if (!matchResult) {
      return;
    }

    return new UnityObject({
      uType: matchResult[1],
      fileID: matchResult[2],
    });
  }

  public static tryParseUnityObjects(source: string): void {
    const objects = source.split(/^--- \!u\!(\d+) \&(\d+)/);
  }
}
