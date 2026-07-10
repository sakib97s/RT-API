import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { exec } from 'child_process';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { ResponsePayload } from 'src/interfaces/response-payload.interface';
import { ReBuildScript } from './interfaces/build-script.interface';

@Injectable()
export class ScriptService {
  private logger = new Logger(ScriptService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * BUILD SCRIPT
   * executeBuildScript()
   * executeDeleteScript()
   * executeUpdateScript()
   */

  async executeRebuildScript(
    dynamicUpdateDto: ReBuildScript,
  ): Promise<ResponsePayload> {
    try {
      const { targetPath, domain, shop, apiBaseUrl } = dynamicUpdateDto;

      // chmod +x create-angular-project.sh
      const dir = `./scripts`;
      const scriptPath = join(dir, 'static-rebuild.sh');

      const scriptExecuteTxt = `sh "${scriptPath}" "${targetPath}" "${domain}" "${shop}" "${apiBaseUrl}"`;
      console.log(scriptExecuteTxt);

      // Execute the shell script
      exec(scriptExecuteTxt, (error, stdout, stderr) => {
        if (error) {
          return {
            success: false,
            message: `Error executing script: ${error.message}`,
          } as ResponsePayload;
        }
        if (stderr) {
          return {
            success: false,
            message: `Script stderr: ${stderr}`,
          } as ResponsePayload;
        }
        return {
          success: false,
          message: `Script output: ${stdout}`,
        } as ResponsePayload;
      });

      return {
        success: true,
        message: `Finished....`,
      } as ResponsePayload;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }
}
