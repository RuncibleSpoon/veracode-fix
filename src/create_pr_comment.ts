import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs';


export async function createPRComment(results:any, options:any, flawInfo:any){

    console.log('Results 0 to work with')
    console.log(results[0])

    //get more information from the flawInfo
    //find the correct flaw info from json inout file
    const resultsFile = fs.readFileSync(flawInfo.resultsFile, 'utf8')
    const data = JSON.parse(resultsFile)
    const flawFile = fs.readFileSync('flawInfo', 'utf8')
    const flawData = JSON.parse(flawFile)
    console.log('Reviewing issueID: '+flawInfo.issuedID)
    const resultArray = data.findings.find((issueId: any) => issueId.issue_id == flawInfo.issuedID)
    const flawCWEID = resultArray.cwe_id
    const flawSeverity = resultArray.severity
    const issueType = resultArray.issue_type
    const display_text = resultArray.display_text
    const sourceFile = flawData.source_file
    const sourceLine = resultArray.files.source_file.line
    const sourceLineStart = sourceLine-5
    const sourceLineEnd = sourceLine+5
    const functionName = resultArray.files.source_file.function_name
    const repositoryEnv:any = process.env

    //crete comment body
    let commentBody = ''
    commentBody = commentBody+'![](https://www.veracode.com/sites/default/files/2022-04/logo_1.svg)\n'
    commentBody = commentBody+'> [!CAUTION]\n'
    commentBody = commentBody+'***Breaking Flaw identified in code!***\n'
    commentBody = commentBody+'\n'
    commentBody = commentBody+'https://github.com/'+repositoryEnv.GITHUB_REPOSITORY+'/blob/'+repositoryEnv.GITHUB_WORKFLOW_SHA+'/'+sourceFile+'#L'+sourceLineStart+'-L'+sourceLineEnd+'\n'
    commentBody = commentBody+'\n'
    commentBody = commentBody+'> [!CAUTION]\n'
    commentBody = commentBody+'CWE: '+flawCWEID+' '+issueType+'<br>Severity: '+flawSeverity+'\n'
    commentBody = commentBody+display_text+'\n'
    commentBody = commentBody+'\n'
    commentBody = commentBody+'```diff\n'
    //commentBody = commentBody+'<br>'
    commentBody = commentBody+results[0]+'\n'
    //commentBody = commentBody+'<br>'
    commentBody = commentBody+'\n```'

    console.log('Comment body')
    console.log(commentBody)

    core.info('check if we run on a pull request')
    let pullRequest = process.env.GITHUB_REF
    console.log(pullRequest)
    let isPR:any = pullRequest?.indexOf("pull")

    if ( isPR >= 1 ){
        core.info("This run is part of a PR, should add some PR comment")
        const context = github.context
        const repository:any = process.env.GITHUB_REPOSITORY
        const token = core.getInput("token")
        const repo = repository.split("/");
        const commentID:any = context.payload.pull_request?.number

        

        try {
            const octokit = github.getOctokit(token);

            const { data: comment } = await octokit.rest.issues.createComment({
                owner: repo[0],
                repo: repo[1],
                issue_number: commentID,
                body: commentBody,
            });
            core.info('Adding scan results as comment to PR #'+commentID)
        } catch (error:any) {
            core.info(error);
        }
    }
    else {
        core.info('We are not running on a pull request')
    }

}