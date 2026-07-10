import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BuildScript,
  DeleteBuildScript,
  GitUpdateAndBuildScript,
  GitUpdateScript,
  ReBuildScript,
  UpdateBuildScript,
} from './interfaces/build-script.interface';
import { ResponsePayload } from '../../interfaces/response-payload.interface';

@Injectable()
export class BuildScriptService {
  private logger = new Logger(BuildScriptService.name);

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Build Script METHODS
   * buildWebsiteFromScript()
   */
  public buildWebsiteFromScript(data: BuildScript) {
    const buildScriptApiBase =
      this.configService.get<string>('buildScriptApiBase');
    const url = `${buildScriptApiBase}/execute-website-build`;

    return new Promise((resolve, reject) => {
      this.httpService.post<ResponsePayload>(url, data).subscribe({
        next: (res) => {
          resolve(res.data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public updateWebsiteFromScript(data: UpdateBuildScript) {
    const buildScriptApiBase =
      this.configService.get<string>('buildScriptApiBase');
    const url = `${buildScriptApiBase}/execute-update-build`;

    return new Promise((resolve, reject) => {
      this.httpService.post<ResponsePayload>(url, data).subscribe({
        next: (res) => {
          resolve(res.data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public rebuildWebsiteFromScript(data: ReBuildScript) {
    const buildScriptApiBase =
      this.configService.get<string>('buildScriptApiBase');
    const url = `${buildScriptApiBase}/execute-rebuild`;

    return new Promise((resolve, reject) => {
      this.httpService.post<ResponsePayload>(url, data).subscribe({
        next: (res) => {
          resolve(res.data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public deleteWebsiteFromScript(data: DeleteBuildScript) {
    const buildScriptApiBase =
      this.configService.get<string>('buildScriptApiBase');
    const url = `${buildScriptApiBase}/execute-website-delete`;

    return new Promise((resolve, reject) => {
      this.httpService.post<ResponsePayload>(url, data).subscribe({
        next: (res) => {
          resolve(res.data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public gitUpdateWebsiteFromScript(data: GitUpdateScript) {
    const buildScriptApiBase =
      this.configService.get<string>('buildScriptApiBase');
    const url = `${buildScriptApiBase}/execute-project-git-update`;

    return new Promise((resolve, reject) => {
      this.httpService.post<ResponsePayload>(url, data).subscribe({
        next: (res) => {
          resolve(res.data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public gitUpdateAndBuildWebsiteFromScript(data: GitUpdateAndBuildScript) {
    const buildScriptApiBase =
      this.configService.get<string>('buildScriptApiBase');
    const url = `${buildScriptApiBase}/execute-project-git-update-and-build`;

    return new Promise((resolve, reject) => {
      this.httpService.post<ResponsePayload>(url, data).subscribe({
        next: (res) => {
          resolve(res.data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public checkDomain(domain: string) {
    const buildScriptApiBase =
      this.configService.get<string>('buildScriptApiBase');
    const url = `${buildScriptApiBase}/check-domain`;

    return new Promise((resolve, reject) => {
      this.httpService
        .get<ResponsePayload>(url, { params: { domain } })
        .subscribe({
          next: (res) => {
            resolve(res.data);
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }
}
